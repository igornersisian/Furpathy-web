import Link from "next/link";
import { getTranslations } from "next-intl/server";

type Props = {
  basePath: string;
  page: number;
  hasMore: boolean;
  extraParams?: Record<string, string | undefined>;
};

export async function Pagination({ basePath, page, hasMore, extraParams = {} }: Props) {
  const t = await getTranslations("list");
  const tA11y = await getTranslations("a11y");

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    for (const [k, v] of Object.entries(extraParams)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const prevHref = page > 1 ? buildHref(page - 1) : null;
  const nextHref = hasMore ? buildHref(page + 1) : null;
  if (!prevHref && !nextHref) return null;

  return (
    <nav
      aria-label={tA11y("pagination")}
      className="mt-16 flex items-center justify-between border-t border-[color:var(--border)] pt-6"
    >
      {prevHref ? (
        <Link href={prevHref} className="mono-label-tight hover:text-[color:var(--accent)]">
          ← {t("prev")}
        </Link>
      ) : (
        <span />
      )}
      <span className="mono-label-tight text-[color:var(--muted)]">{t("page", { n: page })}</span>
      {nextHref ? (
        <Link href={nextHref} className="mono-label-tight hover:text-[color:var(--accent)]">
          {t("next")} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
