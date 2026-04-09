import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col items-start gap-6 px-5 py-20 md:py-28">
      <p className="font-mono text-sm uppercase tracking-widest text-[color:var(--muted)]">404</p>
      <h1 className="font-display text-4xl font-semibold md:text-5xl">{t("title")}</h1>
      <p className="text-lg leading-relaxed text-[color:var(--muted)]">{t("description")}</p>
      <div className="mt-2 flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          {t("backHome")}
        </Link>
        <Link
          href="/articles"
          className="rounded-full border border-[color:var(--border)] px-5 py-2.5 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--surface)]"
        >
          {t("browseArticles")}
        </Link>
      </div>
    </div>
  );
}
