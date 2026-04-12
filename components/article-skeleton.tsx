export function ArticleSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
      <div className="skeleton aspect-[16/9] rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <div className="flex gap-1.5">
          <div className="skeleton h-5 w-14 rounded-full" />
          <div className="skeleton h-5 w-18 rounded-full" />
        </div>
        <div className="skeleton h-6 w-4/5" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/5" />
        <div className="mt-auto flex gap-3">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function ArticleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <ArticleSkeleton key={i} />
      ))}
    </div>
  );
}
