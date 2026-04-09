"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";

const LABELS: Record<Locale, { code: string; name: string }> = {
  en: { code: "EN", name: "English" },
  es: { code: "ES", name: "Español" },
  de: { code: "DE", name: "Deutsch" },
  pt: { code: "PT", name: "Português" },
};

type Translation = { locale: Locale; slug: string };

export function LanguageSwitcher({
  currentLocale,
  translations,
}: {
  currentLocale: Locale;
  translations?: Translation[];
}) {
  const pathname = usePathname() || "/";
  const tFooter = useTranslations("footer");

  function hrefFor(l: Locale): string {
    if (translations && translations.length > 0) {
      const t = translations.find((x) => x.locale === l);
      if (t) return `/${l}/articles/${t.slug}`;
      return `/${l}`;
    }
    // Swap locale segment in current path
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return `/${l}`;
    parts[0] = l;
    return "/" + parts.join("/");
  }

  return (
    <nav aria-label={tFooter("language")} className="flex items-center gap-1 text-sm">
      {routing.locales.map((l) => {
        const active = l === currentLocale;
        const available =
          !translations || translations.length === 0 || translations.some((t) => t.locale === l);
        const label = LABELS[l];
        const className = `inline-flex items-center rounded-full px-2 py-1 text-xs font-medium tracking-wide transition ${
          active
            ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
            : available
              ? "text-[color:var(--muted)] hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--foreground)]"
              : "text-[color:var(--muted)]/50 cursor-not-allowed"
        }`;
        if (!available && !active) {
          return (
            <span key={l} className={className} aria-disabled="true" title={label.name}>
              <span className="sr-only">{label.name}</span>
              <span>{label.code}</span>
            </span>
          );
        }
        return (
          <Link
            key={l}
            href={hrefFor(l)}
            className={className}
            title={label.name}
            hrefLang={l}
            aria-current={active ? "page" : undefined}
          >
            <span className="sr-only">{label.name}</span>
            <span>{label.code}</span>
          </Link>
        );
      })}
    </nav>
  );
}
