import type { ArticleCard as ArticleCardT } from "@/lib/types";
import type { Locale } from "@/i18n/routing";
import { ArticleCard } from "./article-card";
import { ScrollReveal } from "./scroll-reveal";

export function ArticleGrid({
  articles,
  locale,
}: {
  articles: ArticleCardT[];
  locale: Locale;
}) {
  if (articles.length === 0) return null;
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((a, i) => (
        <ScrollReveal key={a.id} delay={i * 60}>
          <ArticleCard article={a} locale={locale} />
        </ScrollReveal>
      ))}
    </div>
  );
}
