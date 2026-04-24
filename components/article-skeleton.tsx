export function ArticleSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="skeleton aspect-[16/10] rounded-sm" />
      <div className="flex gap-2 pt-2">
        <div className="skeleton h-3 w-10 rounded-sm" />
        <div className="skeleton h-3 w-24 rounded-sm" />
      </div>
      <div className="skeleton h-6 w-4/5 rounded-sm" />
      <div className="skeleton h-4 w-full rounded-sm" />
      <div className="skeleton h-4 w-3/5 rounded-sm" />
      <div className="mt-1 flex gap-3">
        <div className="skeleton h-3 w-20 rounded-sm" />
        <div className="skeleton h-3 w-16 rounded-sm" />
      </div>
    </div>
  );
}

export function ArticleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <ArticleSkeleton key={i} />
      ))}
    </div>
  );
}
