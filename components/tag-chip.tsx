import Link from "next/link";
import type { Locale } from "@/i18n/routing";
import { slugifyTag } from "@/lib/tags";

export function TagChip({ tag, locale }: { tag: string; locale: Locale }) {
  return (
    <Link href={`/${locale}/tags/${slugifyTag(tag)}`} className="filter-pill">
      {tag}
    </Link>
  );
}
