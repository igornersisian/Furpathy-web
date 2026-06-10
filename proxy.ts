import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Server-side redirects AND 404s for article/tag routes are handled HERE, in the
// proxy, rather than via `permanentRedirect()` / `notFound()` in the page.
// Next.js 16.2.6 (Turbopack) swallows the sentinels those throw on dynamically
// rendered routes: the throw fires with a correct `;308;` / not-found digest,
// but the response still goes out as 200 — a broken redirect or a soft-404
// (verified via container logs + curl 2026-06-10). `NextResponse` returns real
// Response objects and is immune to that bug. As a bonus the work happens before
// the page renders. Page-level `permanentRedirect`/`notFound` stay as
// defense-in-depth for if/when the framework bug is fixed.

type Loc = "en" | "es" | "de" | "pt";

// Only well-formed lowercase slugs reach an article; this also guarantees the
// value is safe to interpolate into a PostgREST filter (no commas/parens/etc).
const ARTICLE_RE = /^\/(en|es|de|pt)\/articles\/([a-z0-9-]+)\/?$/;
const TAG_RE = /^\/(en|es|de|pt)\/tags\/([^/]+?)\/?$/;

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

// Pure tag slugifier — must match lib/tags.ts:slugifyTag exactly so the proxy
// and the page agree on a tag's canonical form. Inlined to avoid importing
// lib/tags.ts, which pulls in the Supabase client at module load. slugifyTag is
// idempotent (slugifyTag(slugifyTag(x)) === slugifyTag(x)), so redirecting to
// the canonical form can never loop.
function slugifyTag(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

type Action = { kind: "redirect"; to: string } | { kind: "notFound" } | null;

// Resolve an article request: redirect a topic-duplicate/cross-locale slug to
// its canonical destination, 404 a slug no published article owns, else pass.
async function resolveArticle(locale: Loc, slug: string): Promise<Action> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return null;

  const row = await probe(
    base,
    key,
    `or=(slug.eq.${slug},slug_es.eq.${slug},slug_de.eq.${slug},slug_pt.eq.${slug})`,
  );
  if (!row) return { kind: "notFound" };

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
  return { kind: "redirect", to: `/${targetLocale}/articles/${targetSlug}` };
}

// Resolve a tag request: 301 a non-canonical tag spelling to its slug form.
// Pure string work, no DB. (Tag pages are noindex, but consolidating duplicate
// URLs is still correct.) Existence/empty 404s are left to the page.
function resolveTag(locale: Loc, rawSegment: string): Action {
  let decoded: string;
  try {
    decoded = decodeURIComponent(rawSegment);
  } catch {
    return null;
  }
  const canonical = slugifyTag(decoded);
  if (canonical && canonical !== decoded) {
    return { kind: "redirect", to: `/${locale}/tags/${canonical}` };
  }
  return null;
}

export default async function proxy(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname;
    let action: Action = null;

    const a = ARTICLE_RE.exec(path);
    if (a) {
      action = await resolveArticle(a[1] as Loc, a[2]);
    } else {
      const t = TAG_RE.exec(path);
      if (t) action = resolveTag(t[1] as Loc, t[2]);
    }

    if (action?.kind === "redirect") {
      const url = req.nextUrl.clone();
      url.pathname = action.to;
      url.search = "";
      return NextResponse.redirect(url, 308);
    }
    if (action?.kind === "notFound") {
      // Re-render the same path but force the 404 status the swallowed
      // notFound() should have produced. The page renders the not-found UI;
      // this just fixes the status so crawlers don't see a soft-404.
      return NextResponse.rewrite(req.nextUrl, { status: 404 });
    }
  } catch {
    // Fail open: a redirect/404 lookup error must never take down the page.
  }
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
