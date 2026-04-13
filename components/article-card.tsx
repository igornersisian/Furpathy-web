import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ArticleCard as ArticleCardT } from "@/lib/types";
import type { Locale } from "@/i18n/routing";
import { TagChip } from "./tag-chip";
import { formatDate } from "@/lib/format";

export async function ArticleCard({
  article,
  locale,
}: {
  article: ArticleCardT;
  locale: Locale;
}) {
  const t = await getTranslations("article");
  // Fallback (English-only) articles should link to the EN version
  const href = article.isFallback
    ? `/en/articles/${article.slug}`
    : `/${locale}/articles/${article.slug}`;
  const searchText = `${article.title} ${article.description ?? ""}`
    .toLocaleLowerCase(locale)
    .trim();
  return (
    <article
      data-search-text={searchText}
      className="group js-article-card flex flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] transition hover:shadow-lg data-[hidden-by-search=true]:hidden"
    >
      <Link href={href} className="relative block aspect-[16/9] overflow-hidden">
        {article.image ? (
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full bg-[color:var(--accent-soft)]" />
        )}
        {article.isFallback && (
          <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
            {t("onlyInEnglish")}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.tags.slice(0, 3).map((tag) => (
              <TagChip key={tag} tag={tag} locale={locale} />
            ))}
          </div>
        )}
        <Link href={href} className="block">
          <h3 className="font-display text-xl font-semibold leading-snug text-[color:var(--foreground)] group-hover:text-[color:var(--accent)]">
            {article.title}
          </h3>
        </Link>
        {article.description && (
          <p className="line-clamp-3 text-sm text-[color:var(--muted)]">{article.description}</p>
        )}
        <div className="mt-auto flex items-center gap-3 text-xs text-[color:var(--muted)]">
          <time dateTime={article.createdAt}>
            {formatDate(article.createdAt, locale)}
          </time>
          <span aria-hidden>•</span>
          <span>{t("minRead", { minutes: article.readingTimeMin })}</span>
        </div>
      </div>
    </article>
  );
}
