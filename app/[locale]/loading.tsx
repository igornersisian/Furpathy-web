import { ArticleGridSkeleton } from "@/components/article-skeleton";

export default function HomeLoading() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 py-10 md:py-16">
      {/* Hero skeleton */}
      <div className="grid gap-8 md:grid-cols-5 md:items-center">
        <div className="skeleton aspect-[16/10] rounded-3xl md:col-span-3" />
        <div className="flex flex-col gap-4 md:col-span-2">
          <div className="flex gap-1.5">
            <div className="skeleton h-5 w-14 rounded-full" />
            <div className="skeleton h-5 w-18 rounded-full" />
          </div>
          <div className="skeleton h-10 w-4/5" />
          <div className="skeleton h-5 w-full" />
          <div className="skeleton h-5 w-3/4" />
          <div className="flex gap-3">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-4 w-20" />
          </div>
        </div>
      </div>
      {/* Divider */}
      <div className="my-14 flex items-center gap-3">
        <div className="h-px flex-1 bg-[color:var(--border)]" />
        <div className="skeleton h-5 w-5 rounded-full" />
        <div className="h-px flex-1 bg-[color:var(--border)]" />
      </div>
      {/* Grid skeleton */}
      <div className="skeleton mb-6 h-8 w-48" />
      <ArticleGridSkeleton count={6} />
    </div>
  );
}
