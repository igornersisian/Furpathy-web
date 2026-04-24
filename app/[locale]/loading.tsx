import { ArticleGridSkeleton } from "@/components/article-skeleton";

export default function HomeLoading() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 py-10 md:py-16">
      {/* Masthead skeleton */}
      <div className="mb-4 flex items-center justify-between">
        <div className="skeleton h-3 w-24 rounded-sm" />
        <div className="skeleton h-3 w-40 rounded-sm" />
      </div>
      <div className="skeleton mb-2 h-[56px] w-3/4 rounded-sm md:h-[88px]" />
      <div className="skeleton mb-10 h-[56px] w-2/3 rounded-sm md:h-[88px]" />
      {/* Hero skeleton */}
      <div className="mt-8 grid grid-cols-12 gap-6 md:gap-10">
        <div className="skeleton col-span-12 aspect-[3/2] rounded-sm md:col-span-7" />
        <div className="col-span-12 flex flex-col gap-4 md:col-span-5">
          <div className="skeleton h-3 w-20 rounded-sm" />
          <div className="skeleton h-10 w-4/5 rounded-sm" />
          <div className="skeleton h-5 w-full rounded-sm" />
          <div className="skeleton h-5 w-3/4 rounded-sm" />
          <div className="mt-2 flex gap-3">
            <div className="skeleton h-3 w-24 rounded-sm" />
            <div className="skeleton h-3 w-20 rounded-sm" />
          </div>
          <div className="skeleton mt-3 h-10 w-44 rounded-full" />
        </div>
      </div>
      <div className="my-16 h-px w-full bg-[color:var(--border)]" />
      {/* Grid skeleton */}
      <ArticleGridSkeleton count={6} />
    </div>
  );
}
