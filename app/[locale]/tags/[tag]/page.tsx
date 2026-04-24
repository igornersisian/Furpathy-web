import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getByTag } from "@/lib/articles";
import { findTagBySlug, slugifyTag } from "@/lib/tags";
import { ArticleGrid } from "@/components/article-grid";
import { ArticleSearch } from "@/components/article-search";
import { TagFilterBar } from "@/components/tag-filter-bar";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Pagination } from "@/components/pagination";
import { parseLocale } from "@/i18n/routing";
import { buildLocaleAlternates, PAGE_SIZE } from "@/lib/site-config";
import { logger } from "@/lib/logger";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}): Promise<Metadata> {
  const { locale, tag } = await params;
  setRequestLocale(parseLocale(locale));
  const t = await getTranslations({ locale, namespace: "list" });
  const readableTag = (() => {
    try {
      return decodeURIComponent(tag);
    } catch (err) {
      logger.warn("tag-page", "decodeURIComponent failed in generateMetadata", {
        err,
        locale,
        tag,
      });
      return tag;
    }
  })();
  return {
    title: t("byTag", { tag: readableTag }),
    description: t("tagMetaDescription", { tag: readableTag }),
    alternates: buildLocaleAlternates(locale, `/tags/${tag}`),
    robots: { index: false, follow: true },
  };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; tag: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { locale: rawLocale, tag: rawTag } = await params;
  const locale = parseLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations();

  let decoded: string;
  try {
    decoded = decodeURIComponent(rawTag);
  } catch (err) {
    logger.warn("tag-page", "decodeURIComponent failed", { err, locale, tag: rawTag });
    notFound();
  }
  const canonicalSlug = slugifyTag(decoded);
  if (!canonicalSlug) notFound();
  if (canonicalSlug !== rawTag) {
    permanentRedirect(`/${locale}/tags/${canonicalSlug}`);
  }

  const realTag = await findTagBySlug(locale, canonicalSlug);
  if (!realTag) notFound();

  const { page: pageParam, q: qParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const q = (qParam ?? "").trim();

  const { items, hasMore } = await getByTag(locale, realTag, {
    page,
    pageSize: PAGE_SIZE,
    q: q || undefined,
  });
  // Tag itself is valid (findTagBySlug found it); an empty first page with no
  // active search means zero published articles currently match — that's 404.
  // With a search active, show a no-results message instead.
  if (items.length === 0 && page === 1 && !q) notFound();

  const startNumber = (page - 1) * PAGE_SIZE + 1;
  const base = `/${locale}/tags/${canonicalSlug}`;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 py-12 md:py-16">
      <ScrollReveal>
        <p className="mono-label-wide mb-5">{t("list.index")}</p>
      </ScrollReveal>
      <ScrollReveal delay={60}>
        <h1 className="font-display text-[44px] leading-[1.05] font-medium tracking-[-0.015em] md:text-[56px]">
          {t("list.byTag", { tag: realTag })}
        </h1>
      </ScrollReveal>

      <ScrollReveal delay={120}>
        <div className="mt-10 flex flex-col gap-4 border-y border-[color:var(--border)] py-5 md:flex-row md:items-center md:gap-6">
          <ArticleSearch className="md:max-w-[340px] md:flex-1" />
          <TagFilterBar
            locale={locale}
            activeTagSlug={canonicalSlug}
            extraTag={{ label: realTag, slug: canonicalSlug }}
          />
        </div>
      </ScrollReveal>

      {items.length === 0 ? (
        <p className="mt-12 text-[color:var(--muted)]">{t("list.searchNoResults", { query: q })}</p>
      ) : (
        <>
          <div className="mt-12">
            <ArticleGrid articles={items} locale={locale} startNumber={startNumber} />
          </div>
          <Pagination basePath={base} page={page} hasMore={hasMore} extraParams={{ q }} />
        </>
      )}
    </div>
  );
}
