import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ArticleCard as ArticleCardT } from "@/lib/types";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import { ArrowIcon } from "./arrow-icon";
import { CoverFallback } from "./cover-fallback";
import { TagList } from "./tag-list";

export async function ArticleHero({ article, locale }: { article: ArticleCardT; locale: Locale }) {
  const tArticle = await getTranslations("article");
  const tHome = await getTranslations("home");
  const href = `/${locale}/articles/${article.slug}`;

  return (
    <section className="grid grid-cols-12 gap-6 md:gap-10">
      {/* Cover image */}
      <Link
        href={href}
        className="relative col-span-12 block aspect-[3/2] overflow-hidden rounded-sm md:col-span-7"
      >
        {article.image ? (
          <Image
            src={article.image}
            alt={article.title}
            fill
            priority
            sizes="(min-width: 768px) 700px, 100vw"
            className="object-cover"
          />
        ) : (
          <CoverFallback />
        )}
        <span className="paper-stamp absolute top-5 left-5">{tHome("coverStory")}</span>
      </Link>

      {/* Text column */}
      <div className="col-span-12 flex flex-col justify-center md:col-span-5">
        {/* Kicker row: "Cover Story" — rule */}
        <div className="mb-4 flex items-center gap-3">
          <span className="mono-label-wide shrink-0 text-[color:var(--accent)]">
            {tHome("coverStory")}
          </span>
          <span className="rule-line flex-1" />
        </div>

        <TagList tags={article.tags} locale={locale} className="mb-4" />

        <h2 className="font-display text-[30px] leading-[1.1] font-medium md:text-[40px]">
          <Link href={href} className="hover:opacity-85">
            {article.title}
          </Link>
        </h2>

        {article.description && (
          <p className="mt-5 text-[17px] leading-relaxed text-[color:var(--muted)]">
            {article.description}
          </p>
        )}

        <div className="mono-label-tight mt-6 flex items-center gap-4">
          <time dateTime={article.createdAt}>{formatDate(article.createdAt, locale)}</time>
          <span className="inline-block h-px w-5 bg-[color:var(--border)]" aria-hidden="true" />
          <span>{tArticle("minRead", { minutes: article.readingTimeMin })}</span>
        </div>

        <div className="mt-7">
          <Link href={href} className="pill-solid">
            {tArticle("continueReading")}
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}
