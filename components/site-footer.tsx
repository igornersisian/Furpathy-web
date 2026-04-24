import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "./language-switcher";
import { CurrentYear } from "./current-year";
import type { Locale } from "@/i18n/routing";

export async function SiteFooter({ locale }: { locale: Locale }) {
  const tFooter = await getTranslations("footer");
  const tSite = await getTranslations("site");
  const tNav = await getTranslations("nav");

  return (
    <footer className="mt-20 border-t border-[color:var(--border)] bg-[color:var(--paper)]">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-12 gap-8 px-5 py-12 md:px-8">
        <div className="col-span-12 md:col-span-7">
          <Link href={`/${locale}`} className="inline-flex items-center" aria-label={tSite("name")}>
            <Image
              src="/furpathy-logo.png"
              alt={tSite("name")}
              width={160}
              height={160}
              className="h-11 w-auto"
            />
          </Link>
          <p className="mt-4 max-w-[420px] text-[14px] leading-relaxed text-[color:var(--muted)]">
            {tFooter("tagline")}
          </p>
        </div>

        <div className="col-span-6 md:col-span-2">
          <div className="mono-label-wide mb-3">{tFooter("read")}</div>
          <ul className="space-y-2 text-[14px]">
            <li>
              <Link href={`/${locale}`} className="hover:text-[color:var(--accent)]">
                {tNav("home")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/articles`} className="hover:text-[color:var(--accent)]">
                {tNav("articles")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/about`} className="hover:text-[color:var(--accent)]">
                {tNav("about")}
              </Link>
            </li>
          </ul>
        </div>

        <div className="col-span-6 md:col-span-3">
          <div className="mono-label-wide mb-3">{tFooter("languages")}</div>
          <LanguageSwitcher currentLocale={locale} />
        </div>
      </div>

      <div className="border-t border-[color:var(--border)]">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-4 md:px-8">
          <span className="mono-label-tight">
            © <CurrentYear /> {tSite("name")}
          </span>
          <span className="mono-label-tight">{locale.toUpperCase()}</span>
        </div>
      </div>
    </footer>
  );
}
