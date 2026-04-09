import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = await getTranslations("footer");
  const tSite = await getTranslations("site");
  return (
    <footer className="mt-16 border-t border-[color:var(--border)] bg-[color:var(--surface)]">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-1 px-5 py-5 text-xs text-[color:var(--muted)] md:flex-row md:items-center md:justify-between">
        <p className="font-display text-sm text-[color:var(--foreground)]">{tSite("name")}</p>
        <p>{t("rights", { year: new Date().getFullYear() })}</p>
        <p className="uppercase tracking-wide">{locale.toUpperCase()}</p>
      </div>
    </footer>
  );
}
