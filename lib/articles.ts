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

export function mapRow(row: ArticleRow, locale: Locale): Article {
  const enTitle = row.title ?? "Untitled";
  const enSlug = row.slug;
  const enDesc = row.meta_description ?? "";
  const enTags = row.tags ?? [];
  const enContent = row.content_en ?? "";

  if (locale === "en") {
    return {
      id: row.id,
      locale,
      slug: enSlug,
      title: enTitle,
      description: enDesc,
      tags: enTags,
      content: enContent,
      image: row.image_url,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      mediumUrl: row.medium_url,
      isFallback: false,
      readingTimeMin: readTime(enContent),
    };
  }

  const t = row[`title_${locale}` as const];
  const s = row[`slug_${locale}` as const];
  const d = row[`meta_description_${locale}` as const];
  const tg = row[`tags_${locale}` as const];
  const c = row[`content_${locale}` as const];

  const hasTranslation = Boolean(t && c);

  return {
    id: row.id,
    locale,
    slug: hasTranslation ? (s ?? enSlug) : enSlug,
    title: hasTranslation ? (t as string) : enTitle,
    description: hasTranslation ? (d ?? "") : enDesc,
    tags: hasTranslation ? (tg ?? []) : enTags,
    content: hasTranslation ? (c as string) : enContent,
    image: row.image_url,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    mediumUrl: row.medium_url,
    isFallback: !hasTranslation,
    readingTimeMin: readTime(hasTranslation ? (c as string) : enContent),
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

export async function getLatest(locale: Locale, limit = 12): Promise<ArticleCard[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(BASE_COLUMNS)
    .in("status", ["published","queued"])
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) fail("getLatest", error);
  return (data as ArticleRow[] | null ?? []).map((r) => toCard(mapRow(r, locale)));
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
    q = q.contains("tags", [opts.tag]);
  }
  const { data, error } = await q;
  if (error) fail("getAllPublished", error);
  return (data as ArticleRow[] | null ?? []).map((r) => toCard(mapRow(r, locale)));
}

export async function getBySlug(locale: Locale, slug: string): Promise<Article | null> {
  // Try localized slug first
  if (locale !== "en") {
    const { data, error } = await supabase
      .from("articles")
      .select(BASE_COLUMNS)
      .in("status", ["published","queued"])
      .eq(`slug_${locale}`, slug)
      .limit(1);
    if (error) fail("getBySlug", error);
    if (data && data.length > 0) {
      return mapRow(data[0] as ArticleRow, locale);
    }
  }

  // Fallback: EN slug
  const { data, error } = await supabase
    .from("articles")
    .select(BASE_COLUMNS)
    .in("status", ["published","queued"])
    .eq("slug", slug)
    .limit(1);
  if (error) fail("getBySlug", error);
  if (!data || data.length === 0) return null;
  return mapRow(data[0] as ArticleRow, locale);
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
  return (data as ArticleRow[] | null ?? []).map((r) => toCard(mapRow(r, locale)));
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
