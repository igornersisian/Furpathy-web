import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Topic-duplicate / cross-locale 301s are handled HERE, in the proxy, rather
// than in app/[locale]/articles/[slug]/page.tsx. Next.js 16.2.6 (Turbopack)
// swallows the `NEXT_REDIRECT` thrown by `permanentRedirect()` on
// `force-dynamic` pages — the throw fires with a correct `;308;` digest but the
// response still goes out as 200 with the loser's content (verified via
// container logs 2026-06-10). `NextResponse.redirect()` returns a real Response
// object and is immune to that bug. Keeping the logic in the proxy also means
// the redirect happens before the page renders, saving a render.

type Loc = "en" | "es" | "de" | "pt";

// Only well-formed lowercase slugs reach an article; this also guarantees the
// value is safe to interpolate into a PostgREST filter (no commas/parens/etc).
const ARTICLE_RE = /^\/(en|es|de|pt)\/articles\/([a-z0-9-]+)\/?$/;

type Row = {
  id: string;
  canonical_id: string | null;
  slug: string | null;
  title: string | null;
  slug_es: string | null;
  title_es: string | null;
  slug_de: string | null;
  title_de: string | null;
  slug_pt: string | null;
  title_pt: string | null;
};

const SELECT = "id,canonical_id,slug,title,slug_es,title_es,slug_de,title_de,slug_pt,title_pt";

// A translation is "live" only when both its slug and title are set. Mirrors
// lib/articles.ts:translationSlug so the proxy and the page agree on what a
// published locale is.
function slugFor(row: Row, locale: Loc): string | null {
  if (locale === "en") return row.slug && row.title ? row.slug : null;
  if (locale === "es") return row.slug_es && row.title_es ? row.slug_es : null;
  if (locale === "de") return row.slug_de && row.title_de ? row.slug_de : null;
  return row.slug_pt && row.title_pt ? row.slug_pt : null;
}

async function probe(base: string, key: string, filter: string): Promise<Row | null> {
  const url = `${base}/rest/v1/articles?${filter}&status=in.(published,queued)&select=${SELECT}&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: key, authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as Row[];
  return rows[0] ?? null;
}

// Returns the canonical destination path for an article request, or null when
// the request is already canonical (or the slug is unknown — let the page 404).
async function resolveRedirect(req: NextRequest): Promise<string | null> {
  const m = ARTICLE_RE.exec(req.nextUrl.pathname);
  if (!m) return null;
  const locale = m[1] as Loc;
  const slug = m[2];

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return null;

  // Find the row that owns this slug in ANY locale column.
  const row = await probe(
    base,
    key,
    `or=(slug.eq.${slug},slug_es.eq.${slug},slug_de.eq.${slug},slug_pt.eq.${slug})`,
  );
  if (!row) return null;

  // Destination = the winner when this row is a topic-duplicate, else itself.
  let dest = row;
  if (row.canonical_id) {
    const winner = await probe(base, key, `id=eq.${row.canonical_id}`);
    if (winner) dest = winner;
  }

  // Prefer the requested locale's slug on the destination; fall back to EN
  // (the x-default), then to the raw EN slug.
  let targetLocale: Loc = locale;
  let targetSlug = slugFor(dest, locale);
  if (!targetSlug) {
    targetLocale = "en";
    targetSlug = slugFor(dest, "en") ?? dest.slug;
  }
  if (!targetSlug) return null;

  if (targetLocale === locale && targetSlug === slug) return null;
  return `/${targetLocale}/articles/${targetSlug}`;
}

export default async function proxy(req: NextRequest) {
  try {
    const to = await resolveRedirect(req);
    if (to) {
      const url = req.nextUrl.clone();
      url.pathname = to;
      url.search = "";
      return NextResponse.redirect(url, 308);
    }
  } catch {
    // Fail open: a redirect-lookup error must never take down the page.
  }
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
