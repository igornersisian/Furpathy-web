import { routing } from "@/i18n/routing";
import { env } from "./env";

export const SITE_URL = env.SITE_URL;

export const PAGE_SIZE = 12;

// Build an absolute site URL from a path. Prefer this over `${SITE_URL}/${path}`
// — `new URL` normalizes trailing slashes, percent-encodes segments, and makes
// a misconfigured SITE_URL throw loudly at boot rather than silently producing
// broken hrefs.
export function siteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, SITE_URL).toString();
}

// Build the `alternates` block for a page that exists at the same sub-path in
// every locale (home, /articles, /about, /tags/:tag). For per-article pages
// where slugs differ per locale, build `languages` manually from the
// translations list instead — this helper assumes one shared sub-path.
//
// `subPath` is the portion after the locale, e.g. "/articles" or "" for home.
export function buildLocaleAlternates(
  locale: string,
  subPath: string,
): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((l) => [l, siteUrl(`/${l}${subPath}`)]),
  );
  languages["x-default"] = siteUrl(`/${routing.defaultLocale}${subPath}`);
  return {
    canonical: siteUrl(`/${locale}${subPath}`),
    languages,
  };
}
