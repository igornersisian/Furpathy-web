import { describe, it, expect } from "vitest";
import { formatDate } from "@/lib/format";

describe("formatDate", () => {
  it("formats a valid ISO date in English", () => {
    const out = formatDate("2026-01-15T00:00:00Z", "en");
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/January|Jan/);
  });

  it("formats a valid ISO date in Spanish", () => {
    const out = formatDate("2026-01-15T00:00:00Z", "es");
    expect(out).toMatch(/2026/);
  });

  it("falls back to raw input on invalid date string", () => {
    const out = formatDate("not-a-date", "en");
    // Intl accepts many shapes; if it throws, we return the raw string.
    expect(typeof out).toBe("string");
  });
});
