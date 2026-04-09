import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export const revalidate = 86400;

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  return (
    <div className="mx-auto w-full max-w-[720px] px-5 py-16 md:py-24">
      <h1 className="font-display text-4xl font-semibold md:text-5xl">{t("title")}</h1>
      <p className="mt-6 text-lg leading-relaxed text-[color:var(--muted)]">{t("body")}</p>
    </div>
  );
}
