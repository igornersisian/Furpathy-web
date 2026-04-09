import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import type { Locale } from "@/i18n/routing";

export async function SiteHeader({ locale }: { locale: Locale }) {
  const t = await getTranslations("nav");
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--background)]/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-5">
        <Link
          href={`/${locale}`}
          aria-label="Furpathy"
          className="flex items-center"
        >
          <Image
            src="/furpathy-logo.png"
            alt="Furpathy"
            width={633}
            height={581}
            priority
            className="h-10 w-auto md:h-11"
          />
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-[color:var(--muted)] lg:flex">
          <Link href={`/${locale}`} className="hover:text-[color:var(--foreground)]">
            {t("home")}
          </Link>
          <Link href={`/${locale}/articles`} className="hover:text-[color:var(--foreground)]">
            {t("articles")}
          </Link>
          <Link href={`/${locale}/about`} className="hover:text-[color:var(--foreground)]">
            {t("about")}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLocale={locale} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
