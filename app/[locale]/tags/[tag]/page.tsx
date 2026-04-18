import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getByTag } from "@/lib/articles";
import { findTagBySlug, slugifyTag } from "@/lib/tags";
import { ArticleGrid } from "@/components/article-grid";
import { ScrollReveal } from "@/components/scroll-reveal";
import type { Locale } from "@/i18n/routing";

export const revalidate = 600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://furpathy.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}): Promise<Metadata> {
  const { locale, tag } = await params;
  return {
    alternates: {
      canonical: `${SITE_URL}/${locale}/tags/${tag}`,
    },
    robots: { index: false, follow: true },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}) {
  const { locale: rawLocale, tag: rawTag } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations();

  const decoded = decodeURIComponent(rawTag);
  const canonicalSlug = slugifyTag(decoded);
  if (!canonicalSlug) notFound();
  if (canonicalSlug !== rawTag) {
    permanentRedirect(`/${locale}/tags/${canonicalSlug}`);
  }

  const realTag = await findTagBySlug(locale, canonicalSlug);
  if (!realTag) notFound();

  const articles = await getByTag(locale, realTag);
  if (articles.length === 0) notFound();

  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 py-12 md:py-16">
      <ScrollReveal>
        <h1 className="font-display mb-4 text-4xl font-semibold md:text-5xl">
          {t("list.byTag", { tag: realTag })}
        </h1>
      </ScrollReveal>
      <div className="mb-10">
        <Link
          href={`/${locale}/articles`}
          aria-label={t("list.clearTag")}
          className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--accent)] bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-medium text-[color:var(--accent)] transition hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-contrast)]"
        >
          <span>#{realTag}</span>
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
      <ArticleGrid articles={articles} locale={locale} />
    </div>
  );
}
