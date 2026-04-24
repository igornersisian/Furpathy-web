"use client";
import { useSyncExternalStore } from "react";

function formatFor(locale: string): string {
  const now = new Date();
  const day = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(now);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(now);
  return `${day} — ${weekday}`;
}

const subscribe = () => () => {};

export function TodayDate({ locale, className = "" }: { locale: string; className?: string }) {
  const text = useSyncExternalStore(
    subscribe,
    () => formatFor(locale),
    () => "",
  );
  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}
