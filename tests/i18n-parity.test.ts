import { describe, expect, test } from "vitest";
import { routing } from "@/i18n/routing";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import de from "@/messages/de.json";
import pt from "@/messages/pt.json";

type JsonTree = { [key: string]: JsonTree | string };

function collectKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object") {
      out.push(...collectKeys(v, path));
    } else {
      out.push(path);
    }
  }
  return out.sort();
}

const messages: Record<string, JsonTree> = { en, es, de, pt };

describe("i18n message parity", () => {
  test("every locale has the same keys as en", () => {
    // Guard that the fixture covers every configured locale — catches a new
    // locale added to routing.ts without message files.
    for (const loc of routing.locales) {
      expect(messages).toHaveProperty(loc);
    }

    const baseline = collectKeys(en);
    for (const loc of routing.locales) {
      if (loc === "en") continue;
      const keys = collectKeys(messages[loc]);
      const missing = baseline.filter((k) => !keys.includes(k));
      const extra = keys.filter((k) => !baseline.includes(k));
      expect(
        { locale: loc, missing, extra },
        `locale ${loc} drifted from en: missing=${missing.length}, extra=${extra.length}`,
      ).toEqual({ locale: loc, missing: [], extra: [] });
    }
  });
});
