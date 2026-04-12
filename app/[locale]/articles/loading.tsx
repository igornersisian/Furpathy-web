import { ArticleGridSkeleton } from "@/components/article-skeleton";

export default function ArticlesLoading() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 py-12 md:py-16">
      <div className="skeleton mb-8 h-12 w-56" />
      <div className="skeleton mb-6 h-11 w-full rounded-full" />
      <ArticleGridSkeleton count={6} />
    </div>
  );
}
