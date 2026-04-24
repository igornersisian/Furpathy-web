import type { MetadataRoute } from "next";
import { getAllForSitemap } from "@/lib/articles";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site-config";
import { logger } from "@/lib/logger";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  let articles: Awaited<ReturnType<typeof getAllForSitemap>> = [];
  try {
    articles = await getAllForSitemap();
  } catch (err) {
    logger.warn("sitemap", "skipping article entries", { err });
  }

  // Most-recent publishedAt across all articles. Googlebot uses lastModified
  // on index pages to schedule re-crawl, so surface it for home and
  // /articles. About is basically static — no need.
  const latestPublishedAt = articles.reduce<Date | undefined>((acc, a) => {
    if (!a.publishedAt) return acc;
    const d = new Date(a.publishedAt);
    if (Number.isNaN(d.getTime())) return acc;
    if (!acc || d > acc) return d;
    return acc;
  }, undefined);

  // Home, articles list, about for each locale
  for (const locale of routing.locales) {
    const homeLanguages = Object.fromEntries(routing.locales.map((l) => [l, siteUrl(`/${l}`)]));
    entries.push({
      url: siteUrl(`/${locale}`),
      lastModified: latestPublishedAt,
      changeFrequency: "daily",
      priority: 0.9,
      alternates: { languages: homeLanguages },
    });
    entries.push({
      url: siteUrl(`/${locale}/articles`),
      lastModified: latestPublishedAt,
      changeFrequency: "daily",
      priority: 0.8,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, siteUrl(`/${l}/articles`)])),
      },
    });
    entries.push({
      url: siteUrl(`/${locale}/about`),
      changeFrequency: "yearly",
      priority: 0.3,
    });
  }

  for (const a of articles) {
    for (const tr of a.translations) {
      const languages: Record<string, string> = {};
      for (const other of a.translations) {
        languages[other.locale] = siteUrl(`/${other.locale}/articles/${other.slug}`);
      }
      const enTr = a.translations.find((t) => t.locale === "en");
      if (enTr) {
        languages["x-default"] = siteUrl(`/en/articles/${enTr.slug}`);
      }
      entries.push({
        url: siteUrl(`/${tr.locale}/articles/${tr.slug}`),
        lastModified: a.publishedAt ? new Date(a.publishedAt) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: { languages },
      });
    }
  }

  return entries;
}
