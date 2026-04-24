import Link from "next/link";
import type { Locale } from "@/i18n/routing";
import { slugifyTag } from "@/lib/tags";
import { PawIcon } from "./paw-icon";

const DEFAULT_MAX_TAGS = 3;

export function TagList({
  tags,
  locale,
  max = DEFAULT_MAX_TAGS,
  className = "",
}: {
  tags: string[];
  locale: Locale;
  max?: number;
  className?: string;
}) {
  const visible = tags.slice(0, max);
  if (visible.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {visible.map((tag) => (
        <Link key={tag} href={`/${locale}/tags/${slugifyTag(tag)}`} className="tag-pill">
          <PawIcon className="tag-pill__paw" />
          <span>{tag}</span>
        </Link>
      ))}
    </div>
  );
}
