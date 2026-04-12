import Link from "next/link";
import type { Locale } from "@/i18n/routing";
import { PawIcon } from "./paw-icon";

export function TagChip({ tag, locale }: { tag: string; locale: Locale }) {
  return (
    <Link
      href={`/${locale}/tags/${encodeURIComponent(tag)}`}
      className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[color:var(--muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
    >
      <PawIcon className="opacity-50" />
      {tag}
    </Link>
  );
}
