import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getLatest } from "@/lib/articles";
import { ArticleHero } from "@/components/article-hero";
import { ArticleGrid } from "@/components/article-grid";
import { ScrollReveal } from "@/components/scroll-reveal";
import { PawDivider } from "@/components/paw-divider";
import type { Locale } from "@/i18n/routing";

export const revalidate = 600;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations();

  const articles = await getLatest(locale, 13);
  const [hero, ...rest] = articles;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 py-10 md:py-16">
      {hero ? (
        <>
          <ScrollReveal>
            <ArticleHero article={hero} locale={locale} />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <PawDivider className="my-14" />
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold md:text-3xl">
                {t("home.latest")}
              </h2>
              <Link
                href={`/${locale}/articles`}
                className="text-sm font-medium text-[color:var(--accent)] hover:underline"
              >
                {t("home.seeAll")} →
              </Link>
            </div>
          </ScrollReveal>
          <div className="mt-6">
            <ArticleGrid articles={rest.slice(0, 9)} locale={locale} />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-start gap-4">
          <p className="text-[color:var(--muted)]">{t("list.empty")}</p>
          <Link
            href={`/${locale}/articles`}
            className="text-sm font-medium text-[color:var(--accent)] hover:underline"
          >
            {t("list.emptyCta")} →
          </Link>
        </div>
      )}
    </div>
  );
}
