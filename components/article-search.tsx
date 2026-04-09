"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export function ArticleSearch({ locale }: { locale: string }) {
  const t = useTranslations("list");
  const [query, setQuery] = useState("");
  const [noResults, setNoResults] = useState(false);
  const inputId = useId();
  const emptyRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".js-article-card");
    if (cards.length === 0) return;
    const q = query.trim().toLocaleLowerCase(locale);
    let visible = 0;
    cards.forEach((card) => {
      const text = card.dataset.searchText ?? "";
      const match = q === "" || text.includes(q);
      if (match) {
        card.removeAttribute("data-hidden-by-search");
        visible += 1;
      } else {
        card.setAttribute("data-hidden-by-search", "true");
      }
    });
    const empty = q !== "" && visible === 0;
    queueMicrotask(() => setNoResults(empty));
  }, [query, locale]);

  return (
    <div className="mb-6">
      <label htmlFor={inputId} className="sr-only">
        {t("searchLabel")}
      </label>
      <div className="relative">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          className="w-full rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] py-2.5 pl-10 pr-4 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-soft)]"
        />
      </div>
      {noResults && (
        <p
          ref={emptyRef}
          role="status"
          className="mt-4 text-sm text-[color:var(--muted)]"
        >
          {t("searchNoResults", { query })}
        </p>
      )}
    </div>
  );
}
