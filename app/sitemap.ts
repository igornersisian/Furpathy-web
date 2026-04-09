import type { MetadataRoute } from "next";
import { getAllForSitemap } from "@/lib/articles";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://furpathy.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Home, articles list, about for each locale
  for (const locale of routing.locales) {
    const languages = Object.fromEntries(
      routing.locales.map((l) => [l, `${SITE_URL}/${l}`]),
    );
    entries.push({
      url: `${SITE_URL}/${locale}`,
      changeFrequency: "daily",
      priority: 0.9,
      alternates: { languages },
    });
    entries.push({
      url: `${SITE_URL}/${locale}/articles`,
      changeFrequency: "daily",
      priority: 0.8,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${SITE_URL}/${l}/articles`]),
        ),
      },
    });
    entries.push({
      url: `${SITE_URL}/${locale}/about`,
      changeFrequency: "yearly",
      priority: 0.3,
    });
  }

  let articles: Awaited<ReturnType<typeof getAllForSitemap>> = [];
  try {
    articles = await getAllForSitemap();
  } catch (err) {
    console.warn("[sitemap] skipping article entries:", err);
  }
  for (const a of articles) {
    for (const tr of a.translations) {
      const languages: Record<string, string> = {};
      for (const other of a.translations) {
        languages[other.locale] = `${SITE_URL}/${other.locale}/articles/${other.slug}`;
      }
      const enTr = a.translations.find((t) => t.locale === "en");
      if (enTr) languages["x-default"] = `${SITE_URL}/en/articles/${enTr.slug}`;
      entries.push({
        url: `${SITE_URL}/${tr.locale}/articles/${tr.slug}`,
        lastModified: a.publishedAt ? new Date(a.publishedAt) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: { languages },
      });
    }
  }

  return entries;
}
