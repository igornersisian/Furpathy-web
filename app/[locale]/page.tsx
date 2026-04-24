import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getLatest } from "@/lib/articles";
import { ArticleHero } from "@/components/article-hero";
import { ArticleGrid } from "@/components/article-grid";
import { ScrollReveal } from "@/components/scroll-reveal";
import { parseLocale } from "@/i18n/routing";

export const revalidate = 600;

// Homepage shows one hero + a 9-card grid. We fetch a slightly larger batch to
// stay resilient if a handful of recent rows fail the translation-published
// check in `mapRow` (missing slug/title/content for this locale).
const HERO_COUNT = 1;
const GRID_COUNT = 9;
const HOME_FETCH_COUNT = HERO_COUNT + GRID_COUNT + 3;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = parseLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations();

  const articles = await getLatest(locale, HOME_FETCH_COUNT);
  const [hero, ...rest] = articles;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 py-10 md:px-8 md:py-14">
      {hero ? (
        <>
          {/* Masthead */}
          <ScrollReveal>
            <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-baseline md:justify-between">
              <div>
                <div className="mono-label-wide">{t("home.edition")}</div>
                <h1 className="font-display mt-3 text-[38px] leading-[1] font-medium md:text-[56px] md:leading-[0.95]">
                  {t("home.mastheadLine1")}
                  <br />
                  <em className="font-normal text-[color:var(--accent)]">
                    {t("home.mastheadLine2")}
                  </em>
                </h1>
              </div>
              <div className="hidden shrink-0 space-y-1 text-right md:block">
                <div className="mono-label-wide">{t("home.statsLine1")}</div>
                <div className="mono-label-wide text-[color:var(--accent)]">
                  {t("home.statsLine2")}
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="rule-line mb-10" />
          </ScrollReveal>

          {/* Cover story */}
          <ScrollReveal delay={120}>
            <ArticleHero article={hero} locale={locale} />
          </ScrollReveal>

          {/* Section marker */}
          <ScrollReveal delay={180}>
            <div className="section-marker mt-16 mb-8">
              <span className="section-marker__num">§ 02</span>
              <h3 className="section-marker__title">{t("home.latest")}</h3>
              <span className="section-marker__rule" />
              <Link
                href={`/${locale}/articles`}
                className="section-marker__link transition hover:opacity-75"
              >
                {t("home.seeAll")} →
              </Link>
            </div>
          </ScrollReveal>

          <ArticleGrid articles={rest.slice(0, GRID_COUNT)} locale={locale} />
        </>
      ) : (
        <div className="flex flex-col items-start gap-4 py-20">
          <p className="text-[color:var(--muted)]">{t("list.empty")}</p>
          <Link href={`/${locale}/articles`} className="text-sm text-[color:var(--accent)]">
            {t("list.emptyCta")} →
          </Link>
        </div>
      )}
    </div>
  );
}
