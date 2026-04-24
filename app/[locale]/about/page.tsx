import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ScrollReveal } from "@/components/scroll-reveal";
import { routing, parseLocale } from "@/i18n/routing";
import { buildLocaleAlternates } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(parseLocale(locale));
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("title"),
    description: t("body"),
    alternates: buildLocaleAlternates(locale, "/about"),
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = parseLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const tFooter = await getTranslations("footer");

  const title = t("title");
  const brand = "Furpathy";
  const titleBrandIdx = title.indexOf(brand);
  const titleParts =
    titleBrandIdx >= 0
      ? {
          before: title.slice(0, titleBrandIdx),
          brand,
          after: title.slice(titleBrandIdx + brand.length),
        }
      : null;

  const body = t("body");

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-16 md:px-8 md:py-24">
      <ScrollReveal>
        <p className="mono-label-wide mb-5">{t("kicker")}</p>
      </ScrollReveal>
      <ScrollReveal delay={60}>
        <h1 className="font-display text-[44px] leading-[1.04] font-medium tracking-[-0.015em] md:text-[56px] md:leading-[1.02]">
          {titleParts ? (
            <>
              {titleParts.before}
              <em className="font-medium text-[color:var(--accent)]">{titleParts.brand}</em>
              {titleParts.after}
            </>
          ) : (
            title
          )}
        </h1>
      </ScrollReveal>

      <div className="mt-10 grid grid-cols-12 gap-8 md:gap-10">
        <div className="col-span-12 space-y-6 text-[18px] leading-[1.75] md:col-span-8 md:text-[20px]">
          <ScrollReveal delay={120}>
            <p>{body}</p>
          </ScrollReveal>
        </div>

        <aside className="col-span-12 md:col-span-4">
          <ScrollReveal delay={180}>
            <div className="rounded-sm border border-[color:var(--border)] bg-[color:var(--paper)] p-6">
              <p className="mono-label-wide mb-3">{t("finePrintTitle")}</p>
              <ul className="space-y-2.5 text-[14px] text-[color:var(--muted)]">
                <li>
                  {tFooter("languages")}{" "}
                  <span className="text-[color:var(--foreground)]">
                    {routing.locales.map((l) => l.toUpperCase()).join(" · ")}
                  </span>
                </li>
                <li>
                  {t("formatLabel")}{" "}
                  <span className="text-[color:var(--foreground)]">{t("formatValue")}</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>
        </aside>
      </div>
    </div>
  );
}
