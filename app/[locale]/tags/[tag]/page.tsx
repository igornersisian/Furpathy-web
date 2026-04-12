import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getByTag } from "@/lib/articles";
import { ArticleGrid } from "@/components/article-grid";
import { ScrollReveal } from "@/components/scroll-reveal";
import type { Locale } from "@/i18n/routing";

export const revalidate = 600;

export default async function TagPage({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}) {
  const { locale: rawLocale, tag } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const decoded = decodeURIComponent(tag);
  const articles = await getByTag(locale, decoded);

  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 py-12 md:py-16">
      <ScrollReveal>
        <h1 className="font-display mb-4 text-4xl font-semibold md:text-5xl">
          <span className="gradient-text">{t("list.byTag", { tag: decoded })}</span>
        </h1>
      </ScrollReveal>
      <div className="mb-10">
        <Link
          href={`/${locale}/articles`}
          aria-label={t("list.clearTag")}
          className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--accent)] bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-medium text-[color:var(--accent)] transition hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-contrast)]"
        >
          <span>#{decoded}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </Link>
      </div>
      {articles.length === 0 ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-[color:var(--muted)]">{t("list.empty")}</p>
          <Link
            href={`/${locale}/articles`}
            className="text-sm font-medium text-[color:var(--accent)] hover:underline"
          >
            {t("list.emptyCta")} →
          </Link>
        </div>
      ) : (
        <ArticleGrid articles={articles} locale={locale} />
      )}
    </div>
  );
}
