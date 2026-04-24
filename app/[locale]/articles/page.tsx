import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getAllPublished } from "@/lib/articles";
import { ArticleGrid } from "@/components/article-grid";
import { ArticleSearch } from "@/components/article-search";
import { TagFilterBar } from "@/components/tag-filter-bar";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Pagination } from "@/components/pagination";
import { parseLocale } from "@/i18n/routing";
import { buildLocaleAlternates, PAGE_SIZE } from "@/lib/site-config";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(parseLocale(locale));
  const t = await getTranslations({ locale, namespace: "list" });
  return {
    title: t("title"),
    description: t("intro"),
    alternates: buildLocaleAlternates(locale, "/articles"),
  };
}

export default async function ArticlesListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = parseLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations();

  const { page: pageParam, q: qParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const q = (qParam ?? "").trim();

  const { items, hasMore } = await getAllPublished(locale, {
    page,
    pageSize: PAGE_SIZE,
    q: q || undefined,
  });

  const startNumber = (page - 1) * PAGE_SIZE + 1;
  const base = `/${locale}/articles`;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 py-12 md:py-16">
      <ScrollReveal>
        <p className="mono-label-wide mb-5">{t("list.index")}</p>
      </ScrollReveal>
      <ScrollReveal delay={60}>
        <h1 className="font-display text-[44px] leading-[1.05] font-medium tracking-[-0.015em] md:text-[56px]">
          {t("list.title")}
        </h1>
      </ScrollReveal>
      <ScrollReveal delay={120}>
        <p className="mt-4 max-w-[640px] text-[18px] leading-relaxed text-[color:var(--muted)]">
          {t("list.intro")}
        </p>
      </ScrollReveal>

      <ScrollReveal delay={180}>
        <div className="mt-10 flex flex-col gap-4 border-y border-[color:var(--border)] py-5 md:flex-row md:items-center md:gap-6">
          <ArticleSearch className="md:max-w-[340px] md:flex-1" />
          <TagFilterBar locale={locale} />
        </div>
      </ScrollReveal>

      {items.length === 0 ? (
        <p className="mt-12 text-[color:var(--muted)]">
          {q ? t("list.searchNoResults", { query: q }) : t("list.empty")}
        </p>
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
