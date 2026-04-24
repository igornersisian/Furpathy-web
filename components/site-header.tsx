import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { HeaderNav } from "./header-nav";
import { TodayDate } from "./today-date";
import { SearchIcon } from "./search-icon";
import type { Locale } from "@/i18n/routing";

export async function SiteHeader({ locale }: { locale: Locale }) {
  const tNav = await getTranslations("nav");
  const tSite = await getTranslations("site");
  const tList = await getTranslations("list");

  const navItems = [
    { href: `/${locale}`, label: tNav("home") },
    { href: `/${locale}/articles`, label: tNav("articles") },
    { href: `/${locale}/about`, label: tNav("about") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--background)]/88 backdrop-blur">
      <div className="mx-auto w-full max-w-[1200px] px-5 md:px-8">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link href={`/${locale}`} aria-label={tSite("name")} className="flex items-center gap-2">
            <Image
              src="/furpathy-logo.png"
              alt={tSite("name")}
              width={160}
              height={160}
              priority
              className="h-11 w-auto md:h-12"
            />
            <span className="mt-1 hidden font-mono text-[9.5px] leading-none tracking-[0.22em] text-[color:var(--muted)] uppercase sm:inline-block">
              {tSite("kicker")}
            </span>
          </Link>

          <HeaderNav items={navItems} locale={locale} />

          <div className="flex items-center gap-3">
            <form
              action={`/${locale}/articles`}
              method="get"
              role="search"
              className="hidden items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-1.5 transition focus-within:border-[color:var(--accent)] lg:flex"
            >
              <span className="text-[color:var(--muted)]">
                <SearchIcon className="h-3.5 w-3.5" />
              </span>
              <input
                type="search"
                name="q"
                aria-label={tList("searchLabel")}
                placeholder={`${tList("searchLabel")}…`}
                className="w-32 bg-transparent text-sm text-[color:var(--foreground)] outline-none placeholder:text-[color:var(--muted)]"
              />
            </form>
            <LanguageSwitcher currentLocale={locale} />
            <ThemeToggle />
          </div>
        </div>

        <div className="hidden items-center justify-end pb-3 md:flex">
          <TodayDate locale={locale} className="mono-label-tight shrink-0" />
        </div>
      </div>
    </header>
  );
}
