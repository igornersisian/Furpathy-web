// Rendered in place of a cover image when an article has no `image_url`.
// Colours pull from CSS variables so the fallback adapts to light/dark themes
// without the component knowing either.
export function CoverFallback({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-full w-full ${className}`}
      style={{
        background:
          "linear-gradient(135deg, var(--accent-soft) 0%, var(--accent) 55%, var(--foreground) 140%)",
      }}
    />
  );
}
