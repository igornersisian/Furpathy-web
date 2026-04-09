"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

function readTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(() => readTheme());
  const t = useTranslations("theme");

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(next);
  }

  return (
    <button
      type="button"
      aria-label={t("toggle")}
      onClick={toggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--foreground)] transition hover:bg-[color:var(--accent-soft)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
    >
      <span aria-hidden="true" suppressHydrationWarning>
        {theme === "dark" ? "☾" : "☀"}
      </span>
    </button>
  );
}
