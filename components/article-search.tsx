"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SearchIcon } from "./search-icon";

// Delay URL updates until typing pauses. Short enough to feel responsive, long
// enough that router transitions don't thrash mid-word.
const SEARCH_DEBOUNCE_MS = 300;

export function ArticleSearch({ className = "" }: { className?: string }) {
  const t = useTranslations("list");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQ);
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  const [, startTransition] = useTransition();
  const inputId = useId();

  // Re-sync input when URL changes from elsewhere (back button, tag nav).
  // Uses React's "adjusting state during render" pattern instead of useEffect —
  // avoids the extra render pass and satisfies react-hooks/set-state-in-effect.
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    setQuery(urlQ);
  }

  // Debounce URL updates so every keystroke doesn't trigger a server render.
  useEffect(() => {
    if (query === urlQ) return;
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = query.trim();
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      params.delete("page");
      const next = params.toString();
      startTransition(() => {
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query, urlQ, pathname, router, searchParams]);

  return (
    <>
      <label htmlFor={inputId} className="sr-only">
        {t("searchLabel")}
      </label>
      <div
        className={`flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-2 transition focus-within:border-[color:var(--accent)] ${className}`}
      >
        <SearchIcon className="h-3.5 w-3.5 shrink-0 text-[color:var(--muted)]" />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          className="w-full bg-transparent text-[15px] text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] focus:outline-none"
        />
      </div>
    </>
  );
}
