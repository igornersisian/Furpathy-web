import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  getAllSlugsForLocale,
  getBySlug,
  getRelated,
  getTranslationsFor,
} from "@/lib/articles";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ArticleGrid } from "@/components/article-grid";
import { TagChip } from "@/components/tag-chip";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ReadingProgress } from "@/components/reading-progress";
import { ShareButtons } from "@/components/share-buttons";
import { ArticleToc } from "@/components/article-toc";
import { extractToc } from "@/lib/toc";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

export const revalidate = 600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://furpathy.com";

export async function generateStaticParams({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  // Resilient at build time: if Supabase is unreachable (e.g. CI without
  // credentials), fall back to an empty prerender set and let pages render
  // on demand instead of failing the whole build.
  try {
    const rows = await getAllSlugsForLocale(params.locale as Locale);
    return rows.map((r) => ({ slug: r.slug }));
  } catch (err) {
    console.warn("[generateStaticParams] skipping prerender:", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  const article = await getBySlug(locale, slug);
  if (!article) return {};
  const translations = await getTranslationsFor(article.id);
  const languages: Record<string, string> = {};
  for (const t of translations) {
    languages[t.locale] = `${SITE_URL}/${t.locale}/articles/${t.slug}`;
  }
  languages["x-default"] = `${SITE_URL}/en/articles/${
    translations.find((t) => t.locale === "en")?.slug ?? slug
  }`;

  const canonical = `${SITE_URL}/${locale}/articles/${article.slug}`;
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical, languages },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url: canonical,
      images: article.image ? [{ url: article.image }] : undefined,
      publishedTime: article.publishedAt ?? article.createdAt,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: article.image ? [article.image] : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("article");

  const article = await getBySlug(locale, slug);
  if (!article) notFound();

  const [related, translations] = await Promise.all([
    getRelated(locale, article.id, article.tags, 3),
    getTranslationsFor(article.id),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: article.image ? [article.image] : undefined,
    datePublished: article.publishedAt ?? article.createdAt,
    inLanguage: article.isFallback ? "en" : locale,
    mainEntityOfPage: `${SITE_URL}/${locale}/articles/${article.slug}`,
    author: { "@type": "Organization", name: "Furpathy" },
    publisher: {
      "@type": "Organization",
      name: "Furpathy",
      url: SITE_URL,
    },
  };

  const canonicalUrl = `${SITE_URL}/${locale}/articles/${article.slug}`;
  const toc = extractToc(article.content);

  return (
    <article className="pb-16">
      <ReadingProgress />
      {article.image && (
        <div className="relative mx-auto mt-6 aspect-[16/9] w-full max-w-[1100px] overflow-hidden rounded-none md:rounded-3xl">
          <Image
            src={article.image}
            alt={article.title}
            fill
            priority
            sizes="(min-width: 1100px) 1100px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <header className="mx-auto mt-10 max-w-[760px] px-5 text-center">
        {article.tags.length > 0 && (
          <div className="mb-5 flex flex-wrap justify-center gap-1.5">
            {article.tags.slice(0, 5).map((tag) => (
              <TagChip key={tag} tag={tag} locale={locale} />
            ))}
          </div>
        )}
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          {article.title}
        </h1>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-[color:var(--muted)]">
          <time dateTime={article.publishedAt ?? article.createdAt}>
            {t("published", {
              date: formatDate(article.publishedAt ?? article.createdAt, locale),
            })}
          </time>
          <span aria-hidden>•</span>
          <span>{t("minRead", { minutes: article.readingTimeMin })}</span>
          {article.isFallback && (
            <span className="rounded-full bg-[color:var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[color:var(--accent)]">
              {t("onlyInEnglish")}
            </span>
          )}
        </div>
        <div className="mt-6 flex justify-center">
          <LanguageSwitcher currentLocale={locale} translations={translations} />
        </div>
      </header>

      <div className="mx-auto mt-12 grid w-full max-w-[1100px] gap-10 px-5 lg:grid-cols-[1fr_220px]">
        <MarkdownRenderer content={article.content} />
        {toc.length >= 3 && (
          <aside className="order-first lg:order-last">
            <div className="lg:sticky lg:top-24">
              <ArticleToc headings={toc} label={t("toc")} />
            </div>
          </aside>
        )}
      </div>

      <div className="mx-auto mt-12 max-w-[680px] px-5">
        <ShareButtons url={canonicalUrl} title={article.title} />
      </div>

      {locale === "en" && article.mediumUrl && (
        <div className="mx-auto mt-10 max-w-[680px] px-5">
          <a
            href={article.mediumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--foreground)] px-5 py-2.5 text-sm font-medium text-[color:var(--background)] transition hover:opacity-90"
          >
            {t("readOnMedium")} →
          </a>
        </div>
      )}

      {related.length > 0 && (
        <section className="mx-auto mt-20 w-full max-w-[1200px] px-5">
          <h2 className="font-display mb-6 text-2xl font-semibold md:text-3xl">
            {t("continueReading")}
          </h2>
          <ArticleGrid articles={related} locale={locale} />
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </article>
  );
}
