import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ArticleCard as ArticleCardT } from "@/lib/types";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import { CoverFallback } from "./cover-fallback";
import { TagList } from "./tag-list";

export async function ArticleCard({
  article,
  locale,
  number,
  priority = false,
}: {
  article: ArticleCardT;
  locale: Locale;
  number?: number;
  priority?: boolean;
}) {
  const t = await getTranslations("article");
  const href = `/${locale}/articles/${article.slug}`;

  return (
    <article className="group flex flex-col">
      <Link href={href} className="relative mb-4 block aspect-[16/10] overflow-hidden rounded-sm">
        {article.image ? (
          <Image
            src={article.image}
            alt={article.title}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <CoverFallback />
        )}
      </Link>

      {typeof number === "number" && (
        <span className="mono-label-tight mb-2 block text-[color:var(--accent)]">
          № {String(number).padStart(2, "0")}
        </span>
      )}
      <TagList tags={article.tags} locale={locale} />

      <Link href={href} className="mt-2 block">
        <h3 className="font-display text-[22px] leading-[1.15] font-medium transition-colors group-hover:text-[color:var(--accent)]">
          {article.title}
        </h3>
      </Link>

      {article.description && (
        <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-[color:var(--muted)]">
          {article.description}
        </p>
      )}

      <div className="mono-label-tight mt-4 flex items-center gap-3">
        <time dateTime={article.createdAt}>{formatDate(article.createdAt, locale)}</time>
        <span className="inline-block h-px w-4 bg-[color:var(--border)]" aria-hidden="true" />
        <span>{t("minRead", { minutes: article.readingTimeMin })}</span>
      </div>
    </article>
  );
}
