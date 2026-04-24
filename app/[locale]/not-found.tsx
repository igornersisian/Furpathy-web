import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations("notFound");
  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col items-center gap-6 px-5 py-20 text-center md:py-28">
      <p className="mono-label-wide tracking-[0.24em]">Error 404 · {t("title")}</p>
      <div
        className="font-display float-animation text-[clamp(96px,22vw,180px)] leading-none font-medium text-[color:var(--accent)]"
        aria-hidden="true"
      >
        <em>404</em>
      </div>
      <h1 className="font-display text-[clamp(28px,5vw,40px)] leading-[1.1] font-medium tracking-[-0.01em]">
        {t("title")}
      </h1>
      <p className="max-w-[500px] text-[18px] leading-relaxed text-[color:var(--muted)]">
        {t("description")}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link href={`/${locale}`} className="pill-solid">
          ← {t("backHome")}
        </Link>
        <Link href={`/${locale}/articles`} className="pill-outline">
          {t("browseArticles")}
        </Link>
      </div>
    </div>
  );
}
