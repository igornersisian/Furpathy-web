import readingTime from "reading-time";
import { supabase } from "./supabase";
import type { Article, ArticleCard, ArticleRow } from "./types";
import { routing, type Locale } from "@/i18n/routing";

const SHARED_COLUMNS = "id, image_url, status, medium_url, created_at, published_at";

// `queued` covers rows that are scheduled but not yet formally `published`;
// treat both as publicly visible so revalidation picks them up on time.
export const PUBLISHED_STATUSES = ["published", "queued"] as const;

// Column-name helper for the per-locale columns. EN stores slug/title/tags/
// meta_description in unsuffixed columns; other locales use `<base>_<locale>`.
// `content` is the odd one out — EN's column is `content_en`, so callers use
// `content_${locale}` directly (uniform across all locales).
export type LocaleBase = "slug" | "title" | "meta_description" | "tags";
export function col(locale: Locale, base: LocaleBase): string {
  return locale === "en" ? base : `${base}_${locale}`;
}

// Views only need one locale's translation columns. Pulling every locale's
// `content_*` per row turns a list of 48 cards into a multi-megabyte payload —
// especially slow for ES/DE/PT.
function columnsFor(locale: Locale): string {
  return `${SHARED_COLUMNS}, ${col(locale, "slug")}, ${col(locale, "title")}, ${col(locale, "meta_description")}, ${col(locale, "tags")}, content_${locale}`;
}

// Probe queries only need to know whether a translation exists and what its
// slug is — they never render markdown. Skipping the four `content_*` columns
// (each potentially megabytes) is the main win over the previous implementation.
const PROBE_COLUMNS =
  "id, published_at, slug, title, slug_es, title_es, slug_de, title_de, slug_pt, title_pt";

export type ProbeRow = Pick<
  ArticleRow,
  | "id"
  | "published_at"
  | "slug"
  | "title"
  | "slug_es"
  | "title_es"
  | "slug_de"
  | "title_de"
  | "slug_pt"
  | "title_pt"
>;

// A translation is "published" when both its slug and title are set. Content
// presence without a title (or vice versa) would be inconsistent editor state
// that the CMS pipeline is expected to prevent.
export function translationSlug(row: ProbeRow, locale: Locale): string | null {
  if (locale === "en") {
    return row.slug && row.title ? row.slug : null;
  }
  const s = row[`slug_${locale}` as "slug_es"];
  const t = row[`title_${locale}` as "title_es"];
  return s && t ? s : null;
}

// Strip PostgREST control characters so a user-typed query can't break the
// `.or(...)` filter syntax or be reinterpreted as a wildcard.
function sanitizeQuery(raw: string): string {
  return raw
    .replace(/[,%*()&|!<>=]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readTime(content: string): number {
  if (!content) return 1;
  return Math.max(1, Math.round(readingTime(content).minutes));
}

type LocaleFields = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  content: string;
};

// Pull the locale-specific subset from a full row. Returns null when the
// translation isn't published (missing slug, title, or content).
function extractLocaleFields(row: ArticleRow, locale: Locale): LocaleFields | null {
  if (locale === "en") {
    if (!row.slug || !row.content_en) return null;
    return {
      slug: row.slug,
      title: row.title ?? "Untitled",
      description: row.meta_description ?? "",
      tags: row.tags ?? [],
      content: row.content_en,
    };
  }
  const t = row[`title_${locale}` as const];
  const s = row[`slug_${locale}` as const];
  const d = row[`meta_description_${locale}` as const];
  const tg = row[`tags_${locale}` as const];
  const c = row[`content_${locale}` as const];
  if (!t || !s || !c) return null;
  return { slug: s, title: t, description: d ?? "", tags: tg ?? [], content: c };
}

export function mapRow(row: ArticleRow, locale: Locale): Article | null {
  const f = extractLocaleFields(row, locale);
  if (!f) return null;
  return {
    id: row.id,
    locale,
    slug: f.slug,
    title: f.title,
    description: f.description,
    tags: f.tags,
    content: f.content,
    image: row.image_url,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    mediumUrl: row.medium_url,
    readingTimeMin: readTime(f.content),
  };
}

function fail(fn: string, error: unknown): never {
  const detail = error && typeof error === "object" ? JSON.stringify(error) : String(error);
  throw new Error(`[articles.${fn}] Supabase query failed: ${detail}`);
}

function toCard(a: Article): ArticleCard {
  const { content: _content, ...rest } = a;
  return rest;
}

function mapRowsToCards(rows: ArticleRow[], locale: Locale): ArticleCard[] {
  const out: ArticleCard[] = [];
  for (const r of rows) {
    const article = mapRow(r, locale);
    if (article) out.push(toCard(article));
  }
  return out;
}

export async function getLatest(locale: Locale, limit = 12): Promise<ArticleCard[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(columnsFor(locale))
    .in("status", PUBLISHED_STATUSES)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)
    .returns<ArticleRow[]>();
  if (error) fail("getLatest", error);
  return mapRowsToCards(data ?? [], locale);
}

export async function getAllPublished(
  locale: Locale,
  opts: { page?: number; pageSize?: number; tag?: string; q?: string } = {},
): Promise<{ items: ArticleCard[]; hasMore: boolean }> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 24;
  const from = (page - 1) * pageSize;
  const to = from + pageSize; // fetch one extra row to detect a next page

  let query = supabase
    .from("articles")
    .select(columnsFor(locale))
    .in("status", PUBLISHED_STATUSES)
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (opts.tag) {
    query = query.contains(col(locale, "tags"), [opts.tag]);
  }
  const safeQ = opts.q ? sanitizeQuery(opts.q) : "";
  if (safeQ) {
    const titleCol = col(locale, "title");
    const descCol = col(locale, "meta_description");
    query = query.or(`${titleCol}.ilike.%${safeQ}%,${descCol}.ilike.%${safeQ}%`);
  }
  const { data, error } = await query.returns<ArticleRow[]>();
  if (error) fail("getAllPublished", error);
  const rows = data ?? [];
  const cards = mapRowsToCards(rows, locale);
  const hasMore = cards.length > pageSize;
  return { items: hasMore ? cards.slice(0, pageSize) : cards, hasMore };
}

export async function getBySlug(locale: Locale, slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select(columnsFor(locale))
    .in("status", PUBLISHED_STATUSES)
    .eq(col(locale, "slug"), slug)
    .limit(1)
    .returns<ArticleRow[]>();
  if (error) fail("getBySlug", error);
  if (!data || data.length === 0) return null;
  return mapRow(data[0], locale);
}

// Slugs are the URL-safe form produced by slugifyTag (or the database insert
// pipeline), so any well-formed slug is `[a-z0-9-]+`. Anything else can't have
// matched a real article and would also break PostgREST's `.or()` filter.
const SLUG_RE = /^[a-z0-9-]+$/;

// Probe every per-locale slug column; returns the canonical (locale, slug) for
// an article whose *any* translation has this slug. Used to 301-redirect when
// someone hits /<wrong-locale>/articles/<slug>.
export async function findArticleByAnySlug(
  slug: string,
): Promise<{ locale: Locale; slug: string } | null> {
  if (!SLUG_RE.test(slug)) return null;
  const { data, error } = await supabase
    .from("articles")
    .select(PROBE_COLUMNS)
    .in("status", PUBLISHED_STATUSES)
    .or(`slug.eq.${slug},slug_es.eq.${slug},slug_de.eq.${slug},slug_pt.eq.${slug}`)
    .limit(1)
    .returns<ProbeRow[]>();
  if (error) fail("findArticleByAnySlug", error);
  if (!data || data.length === 0) return null;
  const r = data[0];
  for (const l of routing.locales) {
    const s = translationSlug(r, l);
    if (s === slug) return { locale: l, slug };
  }
  // Slug matched a column whose translation isn't actually published (e.g.
  // slug_de set but title_de null). Fall back to EN if valid.
  const enSlug = translationSlug(r, "en");
  if (enSlug) return { locale: "en", slug: enSlug };
  return null;
}

export async function getByTag(
  locale: Locale,
  tag: string,
  opts: { page?: number; pageSize?: number; q?: string } = {},
): Promise<{ items: ArticleCard[]; hasMore: boolean }> {
  return getAllPublished(locale, {
    tag,
    page: opts.page,
    pageSize: opts.pageSize ?? 24,
    q: opts.q,
  });
}

export async function getAllSlugsForLocale(
  locale: Locale,
): Promise<{ id: string; slug: string }[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(PROBE_COLUMNS)
    .in("status", PUBLISHED_STATUSES)
    .returns<ProbeRow[]>();
  if (error) fail("getAllSlugsForLocale", error);
  const rows = data ?? [];
  return rows
    .map((r) => {
      const s = translationSlug(r, locale);
      return s ? { id: r.id, slug: s } : null;
    })
    .filter((x): x is { id: string; slug: string } => x !== null);
}

export async function getRelated(
  locale: Locale,
  articleId: string,
  tags: string[],
  limit = 3,
): Promise<ArticleCard[]> {
  if (!tags || tags.length === 0) return [];
  const { data, error } = await supabase
    .from("articles")
    .select(columnsFor(locale))
    .in("status", PUBLISHED_STATUSES)
    .overlaps(col(locale, "tags"), tags)
    .neq("id", articleId)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)
    .returns<ArticleRow[]>();
  if (error) fail("getRelated", error);
  return mapRowsToCards(data ?? [], locale);
}

export function collectTranslations(row: ProbeRow): { locale: Locale; slug: string }[] {
  const out: { locale: Locale; slug: string }[] = [];
  for (const l of routing.locales) {
    const s = translationSlug(row, l);
    if (s) out.push({ locale: l, slug: s });
  }
  return out;
}

export async function getTranslationsFor(id: string): Promise<{ locale: Locale; slug: string }[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(PROBE_COLUMNS)
    .eq("id", id)
    .limit(1)
    .returns<ProbeRow[]>();
  if (error) fail("getTranslationsFor", error);
  if (!data || data.length === 0) return [];
  return collectTranslations(data[0]);
}

export async function getAllForSitemap(): Promise<
  { id: string; publishedAt: string | null; translations: { locale: Locale; slug: string }[] }[]
> {
  const { data, error } = await supabase
    .from("articles")
    .select(PROBE_COLUMNS)
    .in("status", PUBLISHED_STATUSES)
    .returns<ProbeRow[]>();
  if (error) fail("getAllForSitemap", error);
  const rows = data ?? [];
  return rows.map((r) => ({
    id: r.id,
    publishedAt: r.published_at ?? null,
    translations: collectTranslations(r),
  }));
}
