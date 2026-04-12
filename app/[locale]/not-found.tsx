import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-6 px-5 py-20 text-center md:py-28">
      {/* Sad cat illustration */}
      <div className="float-animation" aria-hidden="true">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          className="text-[color:var(--accent)]"
        >
          {/* Cat ears */}
          <path
            d="M30 55 L20 20 L45 42Z"
            fill="currentColor"
            opacity="0.2"
          />
          <path
            d="M90 55 L100 20 L75 42Z"
            fill="currentColor"
            opacity="0.2"
          />
          {/* Inner ears */}
          <path
            d="M33 50 L26 28 L43 44Z"
            fill="currentColor"
            opacity="0.35"
          />
          <path
            d="M87 50 L94 28 L77 44Z"
            fill="currentColor"
            opacity="0.35"
          />
          {/* Head */}
          <circle cx="60" cy="62" r="30" fill="currentColor" opacity="0.15" />
          {/* Eyes — droopy/sad */}
          <ellipse cx="48" cy="58" rx="4" ry="5" fill="currentColor" opacity="0.6" />
          <ellipse cx="72" cy="58" rx="4" ry="5" fill="currentColor" opacity="0.6" />
          {/* Nose */}
          <path d="M57 68 L60 72 L63 68Z" fill="currentColor" opacity="0.5" />
          {/* Sad mouth */}
          <path
            d="M50 77 Q60 72 70 77"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            opacity="0.4"
            strokeLinecap="round"
          />
          {/* Whiskers */}
          <line x1="20" y1="65" x2="42" y2="68" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
          <line x1="20" y1="72" x2="42" y2="72" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
          <line x1="78" y1="68" x2="100" y2="65" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
          <line x1="78" y1="72" x2="100" y2="72" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
          {/* Paw prints below */}
          <g opacity="0.15" fill="currentColor">
            <ellipse cx="38" cy="102" rx="3" ry="4" />
            <ellipse cx="48" cy="100" rx="2.5" ry="3.5" />
            <ellipse cx="72" cy="100" rx="2.5" ry="3.5" />
            <ellipse cx="82" cy="102" rx="3" ry="4" />
            <ellipse cx="60" cy="106" rx="8" ry="5" />
          </g>
        </svg>
      </div>
      <p className="font-mono text-sm uppercase tracking-widest text-[color:var(--muted)]">404</p>
      <h1 className="font-display text-4xl font-semibold md:text-5xl">
        <span className="gradient-text">{t("title")}</span>
      </h1>
      <p className="text-lg leading-relaxed text-[color:var(--muted)]">{t("description")}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 hover:shadow-md"
        >
          {t("backHome")}
        </Link>
        <Link
          href="/articles"
          className="rounded-full border border-[color:var(--border)] px-5 py-2.5 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--surface)] hover:shadow-md"
        >
          {t("browseArticles")}
        </Link>
      </div>
    </div>
  );
}
