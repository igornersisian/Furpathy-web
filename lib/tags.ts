import { supabase } from "./supabase";
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

export async function findTagBySlug(
  locale: Locale,
  slug: string,
): Promise<string | null> {
  const tagCol = locale === "en" ? "tags" : `tags_${locale}`;
  const { data, error } = await supabase
    .from("articles")
    .select(tagCol)
    .in("status", ["published", "queued"]);
  if (error) {
    throw new Error(`[tags.findTagBySlug] ${JSON.stringify(error)}`);
  }
  const seen = new Set<string>();
  const rows = (data ?? []) as unknown as Record<string, string[] | null>[];
  for (const row of rows) {
    const tags = row[tagCol] ?? [];
    for (const t of tags) {
      if (!t || seen.has(t)) continue;
      seen.add(t);
      if (slugifyTag(t) === slug) return t;
    }
  }
  return null;
}
