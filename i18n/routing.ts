import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es", "de", "pt"] as const,
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export function isLocale(raw: string): raw is Locale {
  return (routing.locales as readonly string[]).includes(raw);
}

export function parseLocale(raw: string): Locale {
  return isLocale(raw) ? raw : routing.defaultLocale;
}
