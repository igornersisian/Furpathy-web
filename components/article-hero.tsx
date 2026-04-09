import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ArticleCard as ArticleCardT } from "@/lib/types";
import type { Locale } from "@/i18n/routing";
import { TagChip } from "./tag-chip";
import { formatDate } from "@/lib/format";

export async function ArticleHero({
  article,
  locale,
}: {
  article: ArticleCardT;
  locale: Locale;
}) {
  const t = await getTranslations("article");
  const href = `/${locale}/articles/${article.slug}`;
  return (
    <section className="grid gap-8 md:grid-cols-5 md:items-center">
      <Link
        href={href}
        className="relative block aspect-[16/10] overflow-hidden rounded-3xl md:col-span-3"
      >
        {article.image ? (
          <Image
            src={article.image}
            alt={article.title}
            fill
            priority
            sizes="(min-width: 1024px) 720px, 100vw"
            className="object-cover transition duration-700 hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-[color:var(--accent-soft)]" />
        )}
      </Link>
      <div className="md:col-span-2">
        {article.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {article.tags.slice(0, 4).map((tag) => (
              <TagChip key={tag} tag={tag} locale={locale} />
            ))}
          </div>
        )}
        <h1 className="font-display text-3xl font-semibold leading-tight text-[color:var(--foreground)] md:text-5xl">
          <Link href={href} className="hover:text-[color:var(--accent)]">
            {article.title}
          </Link>
        </h1>
        {article.description && (
          <p className="mt-4 text-lg text-[color:var(--muted)]">{article.description}</p>
        )}
        <div className="mt-5 flex items-center gap-3 text-sm text-[color:var(--muted)]">
          <time dateTime={article.publishedAt ?? article.createdAt}>
            {formatDate(article.publishedAt ?? article.createdAt, locale)}
          </time>
          <span aria-hidden>•</span>
          <span>{t("minRead", { minutes: article.readingTimeMin })}</span>
          {article.isFallback && (
            <span className="rounded-full bg-[color:var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[color:var(--accent)]">
              {t("onlyInEnglish")}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
