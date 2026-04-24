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
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return `/${l}`;
    parts[0] = l;
    return "/" + parts.join("/");
  }

  return (
    <nav aria-label={tFooter("language")} className="flex items-center gap-0.5 font-mono">
      {routing.locales.map((l, i) => {
        const active = l === currentLocale;
        const available =
          !translations || translations.length === 0 || translations.some((t) => t.locale === l);
        const label = LABELS[l];
        const base =
          "inline-flex items-center px-1.5 text-[10.5px] tracking-[0.18em] uppercase transition";
        const color = active
          ? "text-[color:var(--accent)]"
          : available
            ? "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
            : "text-[color:var(--muted)]/40 cursor-not-allowed";

        const content = (
          <>
            <span className="sr-only">{label.name}</span>
            <span>{label.code}</span>
          </>
        );

        const separator =
          i > 0 ? (
            <span aria-hidden="true" className="text-[10.5px] text-[color:var(--muted)]/50">
              ·
            </span>
          ) : null;

        if (!available && !active) {
          return (
            <span key={l} className="inline-flex items-center">
              {separator}
              <span className={`${base} ${color}`} aria-disabled="true" title={label.name}>
                {content}
              </span>
            </span>
          );
        }
        return (
          <span key={l} className="inline-flex items-center">
            {separator}
            <Link
              href={hrefFor(l)}
              className={`${base} ${color}`}
              title={label.name}
              hrefLang={l}
              aria-current={active ? "page" : undefined}
            >
              {content}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
