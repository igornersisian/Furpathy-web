import { ArticleGridSkeleton } from "@/components/article-skeleton";

export default function ArticlesLoading() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 py-12 md:py-16">
      <div className="skeleton mb-5 h-3 w-20 rounded-sm" />
      <div className="skeleton mb-4 h-[56px] w-3/5 rounded-sm" />
      <div className="skeleton mb-8 h-5 w-2/5 rounded-sm" />
      <div className="mb-10 flex flex-col gap-4 border-y border-[color:var(--border)] py-5 md:flex-row md:items-center md:gap-6">
        <div className="skeleton h-10 w-full rounded-full md:max-w-[340px]" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-7 w-16 rounded-full" />
          ))}
        </div>
      </div>
      <ArticleGridSkeleton count={6} />
    </div>
  );
}
