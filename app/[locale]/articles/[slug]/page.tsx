import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  findArticleByAnySlug,
  getAllSlugsForLocale,
  getBySlug,
  getRelated,
  getTranslationsFor,
} from "@/lib/articles";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ArticleGrid } from "@/components/article-grid";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ReadingProgress } from "@/components/reading-progress";
import { ShareButtons } from "@/components/share-buttons";
import { ArticleToc } from "@/components/article-toc";
import { ScrollReveal } from "@/components/scroll-reveal";
import { TagList } from "@/components/tag-list";
import { extractToc } from "@/lib/toc";
import { formatDate } from "@/lib/format";
import { parseLocale } from "@/i18n/routing";
import { SITE_URL, siteUrl } from "@/lib/site-config";
import { logger } from "@/lib/logger";

export const revalidate = 600;

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  try {
    const rows = await getAllSlugsForLocale(parseLocale(params.locale));
    return rows.map((r) => ({ slug: r.slug }));
  } catch (err) {
    logger.warn("generateStaticParams", "skipping prerender", { err, locale: params.locale });
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = parseLocale(rawLocale);
  setRequestLocale(locale);
  const article = await getBySlug(locale, slug);
  if (!article) return {};
  const translations = await getTranslationsFor(article.id);
  const languages: Record<string, string> = {};
  for (const t of translations) {
    languages[t.locale] = siteUrl(`/${t.locale}/articles/${t.slug}`);
  }
  const enTr = translations.find((t) => t.locale === "en");
  if (enTr) {
    languages["x-default"] = siteUrl(`/en/articles/${enTr.slug}`);
  }

  const canonical = siteUrl(`/${locale}/articles/${article.slug}`);
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
      publishedTime: article.createdAt,
      modifiedTime: article.publishedAt ?? article.createdAt,
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
  const locale = parseLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("article");
  const tNav = await getTranslations("nav");
  const tShare = await getTranslations("share");

  const article = await getBySlug(locale, slug);
  if (!article) {
    const probe = await findArticleByAnySlug(slug);
    if (probe && (probe.locale !== locale || probe.slug !== slug)) {
      permanentRedirect(`/${probe.locale}/articles/${probe.slug}`);
    }
    notFound();
  }

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
    datePublished: article.createdAt,
    dateModified: article.publishedAt ?? article.createdAt,
    inLanguage: locale,
    mainEntityOfPage: siteUrl(`/${locale}/articles/${article.slug}`),
    author: { "@type": "Organization", name: "Furpathy" },
    publisher: {
      "@type": "Organization",
      name: "Furpathy",
      url: SITE_URL,
    },
  };

  const canonicalUrl = siteUrl(`/${locale}/articles/${article.slug}`);
  const toc = extractToc(article.content);
  const breadcrumbTags = article.tags.slice(0, 3).join(" · ");

  return (
    <article className="pb-20">
      <ReadingProgress />

      <div className="mx-auto w-full max-w-[1100px] px-5 pt-10 md:px-8 md:pt-12">
        <div className="mono-label-tight mb-4 flex flex-wrap items-center gap-2">
          <Link
            href={`/${locale}/articles`}
            className="text-[color:var(--accent)] transition hover:text-[color:var(--accent)]"
          >
            ← {tNav("articles")}
          </Link>
          {breadcrumbTags && (
            <>
              <span aria-hidden="true" className="text-[color:var(--border)]">
                /
              </span>
              <span>{breadcrumbTags}</span>
            </>
          )}
        </div>

        <h1 className="font-display max-w-[900px] text-[40px] leading-[1.04] font-medium tracking-[-0.015em] md:text-[56px] md:leading-[1.02]">
          {article.title}
        </h1>

        {article.description && (
          <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-[color:var(--muted)] md:text-[20px]">
            {article.description}
          </p>
        )}

        <div className="mono-label-tight mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <time dateTime={article.createdAt}>{formatDate(article.createdAt, locale)}</time>
          <span aria-hidden="true" className="inline-block h-px w-5 bg-[color:var(--border)]" />
          <span>{t("minRead", { minutes: article.readingTimeMin })}</span>
          <span aria-hidden="true" className="inline-block h-px w-5 bg-[color:var(--border)]" />
          <LanguageSwitcher currentLocale={locale} translations={translations} />
        </div>

        <TagList tags={article.tags} locale={locale} className="mt-5" />

        {article.image && (
          <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-sm">
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

        <div className="mt-12 grid grid-cols-12 gap-8 md:gap-10">
          {toc.length >= 3 && (
            <aside className="order-2 col-span-12 md:order-1 md:col-span-3">
              <div className="md:sticky md:top-28">
                <ArticleToc headings={toc} label={t("toc")} />
                <div className="rule-line mt-6" aria-hidden="true" />
                <p className="mono-label-wide mt-4">{tShare("label")}</p>
                <div className="mt-3">
                  <ShareButtons url={canonicalUrl} />
                </div>
              </div>
            </aside>
          )}
          <div
            className={
              toc.length >= 3 ? "order-1 col-span-12 md:order-2 md:col-span-9" : "col-span-12"
            }
          >
            <MarkdownRenderer content={article.content} />

            {toc.length < 3 && (
              <div className="mt-12 border-t border-[color:var(--border)] pt-8">
                <p className="mono-label-wide mb-3">{tShare("label")}</p>
                <ShareButtons url={canonicalUrl} />
              </div>
            )}

            {locale === "en" && article.mediumUrl && (
              <div className="mt-10">
                <a
                  href={article.mediumUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pill-outline"
                >
                  {t("readOnMedium")} →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-20 w-full max-w-[1200px] px-5 md:px-8">
          <ScrollReveal>
            <div className="section-marker mb-8">
              <span className="section-marker__num">§ 02</span>
              <h2 className="section-marker__title">{t("continueReading")}</h2>
              <span className="section-marker__rule" aria-hidden="true" />
            </div>
          </ScrollReveal>
          <ArticleGrid articles={related} locale={locale} numbered={false} />
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </article>
  );
}
