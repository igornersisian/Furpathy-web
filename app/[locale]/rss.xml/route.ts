import { getLatest } from "@/lib/articles";
import { routing, type Locale } from "@/i18n/routing";
import type { NextRequest } from "next/server";

export const revalidate = 600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://furpathy.com";

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: rawLocale } = await params;
  if (!routing.locales.includes(rawLocale as Locale)) {
    return new Response("Not found", { status: 404 });
  }
  const locale = rawLocale as Locale;
  const allArticles = await getLatest(locale, 30);
  // Exclude fallback (English-only) articles from non-EN feeds
  const articles = locale === "en"
    ? allArticles
    : allArticles.filter((a) => !a.isFallback);
  const items = articles
    .map((a) => {
      const url = `${SITE_URL}/${locale}/articles/${a.slug}`;
      return `    <item>
      <title>${escape(a.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(a.createdAt).toUTCString()}</pubDate>
      <description>${escape(a.description ?? "")}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Furpathy (${locale.toUpperCase()})</title>
    <link>${SITE_URL}/${locale}</link>
    <description>Warm, honest writing about life with dogs and cats.</description>
    <language>${locale}</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=600",
    },
  });
}
