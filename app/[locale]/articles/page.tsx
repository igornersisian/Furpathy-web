import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getAllPublished } from "@/lib/articles";
import { ArticleGrid } from "@/components/article-grid";
import { ArticleSearch } from "@/components/article-search";
import type { Locale } from "@/i18n/routing";

export const revalidate = 600;

export default async function ArticlesListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations();

  const all = await getAllPublished(locale, { pageSize: 48 });

  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 py-12 md:py-16">
      <h1 className="font-display mb-8 text-4xl font-semibold md:text-5xl">
        {t("list.title")}
      </h1>
      <ArticleSearch locale={locale} />
      {all.length === 0 ? (
        <p className="text-[color:var(--muted)]">{t("list.empty")}</p>
      ) : (
        <ArticleGrid articles={all} locale={locale} />
      )}
    </div>
  );
}
