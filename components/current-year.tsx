"use client";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function CurrentYear() {
  const year = useSyncExternalStore(
    subscribe,
    () => String(new Date().getFullYear()),
    () => "",
  );
  return <span suppressHydrationWarning>{year}</span>;
}
