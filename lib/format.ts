import type { Locale } from "@/i18n/routing";
import { logger } from "./logger";

export function formatDate(iso: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch (err) {
    logger.warn("format", "Intl.DateTimeFormat failed", { err, locale });
    return iso;
  }
}
