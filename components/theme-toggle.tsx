"use client";
import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

function readTheme(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// /theme-init.js (loaded with strategy="beforeInteractive") sets the `.dark`
// class before React hydrates, so the DOM is the source of truth after first
// paint. Subscribe to class mutations in case the toggle (or another tab)
// changes it.
function subscribeTheme(cb: () => void): () => void {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => obs.disconnect();
}

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ThemeToggle() {
  // Server snapshot doesn't know the user's preference; return null so the
  // icon stays hidden until first client paint, avoiding a moon→sun flash on
  // dark-mode users.
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => null);
  const t = useTranslations("theme");

  function toggle() {
    const current = document.documentElement.classList.contains("dark") ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(next);
  }

  return (
    <button
      type="button"
      aria-label={t("toggle")}
      aria-pressed={theme === null ? undefined : theme === "dark"}
      onClick={toggle}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--foreground)] transition hover:text-[color:var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
      suppressHydrationWarning
    >
      <span aria-hidden={theme === null} suppressHydrationWarning>
        {theme === null ? null : theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  );
}
