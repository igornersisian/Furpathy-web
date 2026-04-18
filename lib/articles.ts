import readingTime from "reading-time";
import { supabase } from "./supabase";
import type { Article, ArticleCard, ArticleRow } from "./types";
import type { Locale } from "@/i18n/routing";

const BASE_COLUMNS = `
  id, slug, title, meta_description, tags, content_en,
  title_es, slug_es, meta_description_es, tags_es, content_es,
  title_de, slug_de, meta_description_de, tags_de, content_de,
  title_pt, slug_pt, meta_description_pt, tags_pt, content_pt,
  image_url, status, medium_url, created_at, published_at
`;

function readTime(content: string): number {
  if (!content) return 1;
  return Math.max(1, Math.round(readingTime(content).minutes));
}

export function mapRow(row: ArticleRow, locale: Locale): Article | null {
  if (locale === "en") {
    if (!row.slug || !row.content_en) return null;
    const content = row.content_en;
    return {
      id: row.id,
      locale,
      slug: row.slug,
      title: row.title ?? "Untitled",
      description: row.meta_description ?? "",
      tags: row.tags ?? [],
      content,
      image: row.image_url,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      mediumUrl: row.medium_url,
      readingTimeMin: readTime(content),
    };
  }

  const t = row[`title_${locale}` as const];
  const s = row[`slug_${locale}` as const];
  const d = row[`meta_description_${locale}` as const];
  const tg = row[`tags_${locale}` as const];
  const c = row[`content_${locale}` as const];

  if (!t || !s || !c) return null;

  return {
    id: row.id,
    locale,
    slug: s,
    title: t,
    description: d ?? "",
    tags: tg ?? [],
    content: c,
    image: row.image_url,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    mediumUrl: row.medium_url,
    readingTimeMin: readTime(c),
  };
}

function fail(fn: string, error: unknown): never {
  const detail =
    error && typeof error === "object" ? JSON.stringify(error) : String(error);
  throw new Error(`[articles.${fn}] Supabase query failed: ${detail}`);
}

function toCard(a: Article): ArticleCard {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { content, ...rest } = a;
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
    .select(BASE_COLUMNS)
    .in("status", ["published","queued"])
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) fail("getLatest", error);
  return mapRowsToCards((data as ArticleRow[] | null) ?? [], locale);
}

export async function getAllPublished(
  locale: Locale,
  opts: { page?: number; pageSize?: number; tag?: string } = {},
): Promise<ArticleCard[]> {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 24;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("articles")
    .select(BASE_COLUMNS)
    .in("status", ["published","queued"])
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (opts.tag) {
    const tagCol = locale === "en" ? "tags" : `tags_${locale}`;
    q = q.contains(tagCol, [opts.tag]);
  }
  const { data, error } = await q;
  if (error) fail("getAllPublished", error);
  return mapRowsToCards((data as ArticleRow[] | null) ?? [], locale);
}

export async function getBySlug(locale: Locale, slug: string): Promise<Article | null> {
  const slugCol = locale === "en" ? "slug" : `slug_${locale}`;
  const { data, error } = await supabase
    .from("articles")
    .select(BASE_COLUMNS)
    .in("status", ["published","queued"])
    .eq(slugCol, slug)
    .limit(1);
  if (error) fail("getBySlug", error);
  if (!data || data.length === 0) return null;
  return mapRow(data[0] as ArticleRow, locale);
}

// Probe every per-locale slug column; returns the canonical (locale, slug) for
// an article whose *any* translation has this slug. Used to 301-redirect when
// someone hits /<wrong-locale>/articles/<slug>.
export async function findArticleByAnySlug(
  slug: string,
): Promise<{ locale: Locale; slug: string } | null> {
  const { data, error } = await supabase
    .from("articles")
    .select("slug, slug_es, slug_de, slug_pt, title, title_es, title_de, title_pt, content_en, content_es, content_de, content_pt")
    .in("status", ["published","queued"])
    .or(`slug.eq.${slug},slug_es.eq.${slug},slug_de.eq.${slug},slug_pt.eq.${slug}`)
    .limit(1);
  if (error) fail("findArticleByAnySlug", error);
  if (!data || data.length === 0) return null;
  const r = data[0];
  if (r.slug === slug && r.title && r.content_en) return { locale: "en", slug };
  for (const l of ["es", "de", "pt"] as const) {
    const s = r[`slug_${l}` as "slug_es"] as string | null;
    const t = r[`title_${l}` as "title_es"] as string | null;
    const c = r[`content_${l}` as "content_es"] as string | null;
    if (s === slug && t && c) return { locale: l, slug };
  }
  // Slug matched a column whose translation isn't actually published (e.g.
  // slug_de set but title_de/content_de null). Fall back to EN if valid.
  if (r.slug && r.title && r.content_en) return { locale: "en", slug: r.slug as string };
  return null;
}

export async function getByTag(locale: Locale, tag: string): Promise<ArticleCard[]> {
  return getAllPublished(locale, { tag, pageSize: 60 });
}

export async function getAllSlugsForLocale(
  locale: Locale,
): Promise<{ id: string; slug: string }[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("id, slug, slug_es, slug_de, slug_pt, title_es, title_de, title_pt, content_es, content_de, content_pt")
    .in("status", ["published","queued"]);
  if (error) fail("getAllSlugsForLocale", error);
  return (data ?? [])
    .map((r) => {
      if (locale === "en") return { id: r.id as string, slug: r.slug as string };
      const s = r[`slug_${locale}` as "slug_es" | "slug_de" | "slug_pt"] as string | null;
      const t = r[`title_${locale}` as "title_es" | "title_de" | "title_pt"] as string | null;
      const c = r[`content_${locale}` as "content_es" | "content_de" | "content_pt"] as string | null;
      if (!s || !t || !c) return null;
      return { id: r.id as string, slug: s };
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
    .select(BASE_COLUMNS)
    .in("status", ["published","queued"])
    .overlaps("tags", tags)
    .neq("id", articleId)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) fail("getRelated", error);
  return mapRowsToCards((data as ArticleRow[] | null) ?? [], locale);
}

export async function getTranslationsFor(
  id: string,
): Promise<{ locale: Locale; slug: string }[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(
      "slug, slug_es, slug_de, slug_pt, title, title_es, title_de, title_pt, content_en, content_es, content_de, content_pt",
    )
    .eq("id", id)
    .limit(1);
  if (error) fail("getTranslationsFor", error);
  if (!data || data.length === 0) return [];
  const r = data[0];
  const out: { locale: Locale; slug: string }[] = [];
  if (r.title && r.content_en && r.slug) out.push({ locale: "en", slug: r.slug as string });
  (["es", "de", "pt"] as const).forEach((l) => {
    const t = r[`title_${l}` as "title_es"] as string | null;
    const c = r[`content_${l}` as "content_es"] as string | null;
    const s = r[`slug_${l}` as "slug_es"] as string | null;
    if (t && c && s) out.push({ locale: l, slug: s });
  });
  return out;
}

export async function getAllForSitemap(): Promise<
  { id: string; publishedAt: string | null; translations: { locale: Locale; slug: string }[] }[]
> {
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, published_at, slug, slug_es, slug_de, slug_pt, title, title_es, title_de, title_pt, content_en, content_es, content_de, content_pt",
    )
    .in("status", ["published","queued"]);
  if (error) fail("getAllForSitemap", error);
  return (data ?? []).map((r) => {
    const translations: { locale: Locale; slug: string }[] = [];
    if (r.title && r.content_en && r.slug) translations.push({ locale: "en", slug: r.slug as string });
    (["es", "de", "pt"] as const).forEach((l) => {
      const t = r[`title_${l}` as "title_es"] as string | null;
      const c = r[`content_${l}` as "content_es"] as string | null;
      const s = r[`slug_${l}` as "slug_es"] as string | null;
      if (t && c && s) translations.push({ locale: l, slug: s });
    });
    return {
      id: r.id as string,
      publishedAt: (r.published_at as string | null) ?? null,
      translations,
    };
  });
}
