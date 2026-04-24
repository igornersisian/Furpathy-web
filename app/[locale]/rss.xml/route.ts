import { getTranslations } from "next-intl/server";
import { getLatest } from "@/lib/articles";
import { isLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site-config";
import type { NextRequest } from "next/server";

export const dynamic = "force-static";
export const revalidate = 600;

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    return new Response("Not found", { status: 404 });
  }
  const locale = rawLocale;
  const tSite = await getTranslations({ locale, namespace: "site" });
  const articles = await getLatest(locale, 30);
  const items = articles
    .map((a) => {
      const url = siteUrl(`/${locale}/articles/${a.slug}`);
      // Prefer published_at (the public face of the article). Fall back to
      // created_at for older rows that may not have been backfilled.
      const pubSource = a.publishedAt ?? a.createdAt;
      return `    <item>
      <title>${escape(a.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(pubSource).toUTCString()}</pubDate>
      <description>${escape(a.description ?? "")}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Furpathy (${locale.toUpperCase()})</title>
    <link>${siteUrl(`/${locale}`)}</link>
    <description>${escape(tSite("tagline"))}</description>
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
