import type { TocHeading } from "@/lib/toc";

function romanize(n: number): string {
  const map: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  let num = n;
  for (const [v, s] of map) {
    while (num >= v) {
      out += s;
      num -= v;
    }
  }
  return out;
}

export function ArticleToc({ headings, label }: { headings: TocHeading[]; label: string }) {
  if (headings.length < 3) return null;

  const romanForIndex: (string | null)[] = [];
  let topIndex = 0;
  for (const h of headings) {
    if (h.depth === 2) {
      topIndex += 1;
      romanForIndex.push(romanize(topIndex));
    } else {
      romanForIndex.push(null);
    }
  }

  return (
    <nav aria-label={label}>
      <p className="mono-label-wide mb-3">{label}</p>
      <ol className="space-y-2.5 text-[14px] leading-snug">
        {headings.map((h, i) => {
          const isTop = h.depth === 2;
          const roman = romanForIndex[i];
          return (
            <li key={h.id} className={isTop ? "" : "pl-4 text-[color:var(--muted)]"}>
              <a
                href={`#${h.id}`}
                className="inline-flex gap-1.5 transition hover:text-[color:var(--accent)]"
              >
                {roman && <span className="shrink-0">{roman}.</span>}
                <span className="line-clamp-2">{h.text}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
