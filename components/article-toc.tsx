import type { TocHeading } from "@/lib/toc";

export function ArticleToc({
  headings,
  label,
}: {
  headings: TocHeading[];
  label: string;
}) {
  if (headings.length < 3) return null;

  return (
    <nav aria-label={label} className="text-sm">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-[color:var(--muted)]">
        {label}
      </p>
      <ol className="space-y-2 border-l border-[color:var(--border)] pl-4">
        {headings.map((h) => (
          <li
            key={h.id}
            className={h.depth === 3 ? "pl-4 text-[color:var(--muted)]" : ""}
          >
            <a
              href={`#${h.id}`}
              className="line-clamp-2 transition hover:text-[color:var(--accent)]"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
