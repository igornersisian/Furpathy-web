import { unstable_cache } from "next/cache";
import { supabase } from "./supabase";
import { PUBLISHED_STATUSES, col } from "./articles";
import type { Locale } from "@/i18n/routing";

export function slugifyTag(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchTagsForLocale(locale: Locale): Promise<string[][]> {
  const tagCol = col(locale, "tags");
  const { data, error } = await supabase
    .from("articles")
    .select(tagCol)
    .in("status", PUBLISHED_STATUSES)
    .returns<Record<string, string[] | null>[]>();
  if (error) {
    throw new Error(`[tags.fetchTagsForLocale] ${JSON.stringify(error)}`);
  }
  const rows = data ?? [];
  return rows.map((row) => row[tagCol] ?? []);
}

// Tag aggregation has to happen in JS because PostgREST doesn't expose
// array unnest+count. Pulling every row per request gets expensive as the
// archive grows, so cache the per-locale tag arrays and aggregate from cache.
const getCachedTagsForLocale = unstable_cache(fetchTagsForLocale, ["tag-arrays-by-locale"], {
  revalidate: 3600,
  tags: ["articles:tags"],
});

export async function findTagBySlug(locale: Locale, slug: string): Promise<string | null> {
  const rows = await getCachedTagsForLocale(locale);
  const seen = new Set<string>();
  for (const tags of rows) {
    for (const t of tags) {
      if (!t || seen.has(t)) continue;
      seen.add(t);
      if (slugifyTag(t) === slug) return t;
    }
  }
  return null;
}

export async function getPopularTags(
  locale: Locale,
  limit = 6,
): Promise<{ label: string; slug: string; count: number }[]> {
  const rows = await getCachedTagsForLocale(locale);
  const counts = new Map<string, { label: string; count: number }>();
  for (const tags of rows) {
    for (const raw of tags) {
      if (!raw) continue;
      const slug = slugifyTag(raw);
      if (!slug) continue;
      const existing = counts.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        // Preserve the first spelling we see — capitalization, accents, etc.
        counts.set(slug, { label: raw, count: 1 });
      }
    }
  }
  return Array.from(counts.entries())
    .map(([slug, { label, count }]) => ({ slug, label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}
