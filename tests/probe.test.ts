import { describe, it, expect } from "vitest";
import { translationSlug, collectTranslations, type ProbeRow } from "@/lib/articles";

function probe(overrides: Partial<ProbeRow> = {}): ProbeRow {
  return {
    id: "1",
    published_at: "2026-01-01T00:00:00Z",
    slug: "hello",
    title: "Hello",
    slug_es: null,
    title_es: null,
    slug_de: null,
    title_de: null,
    slug_pt: null,
    title_pt: null,
    ...overrides,
  };
}

describe("translationSlug", () => {
  it("returns EN slug when both slug and title are present", () => {
    expect(translationSlug(probe(), "en")).toBe("hello");
  });

  it("returns null for EN when title is missing", () => {
    expect(translationSlug(probe({ title: null }), "en")).toBeNull();
  });

  it("returns null for EN when slug is missing", () => {
    expect(translationSlug(probe({ slug: null }), "en")).toBeNull();
  });

  it("returns ES slug when both slug_es and title_es are present", () => {
    const row = probe({ slug_es: "hola", title_es: "Hola" });
    expect(translationSlug(row, "es")).toBe("hola");
  });

  it("returns null for ES when only slug_es is set (missing title_es)", () => {
    const row = probe({ slug_es: "hola", title_es: null });
    expect(translationSlug(row, "es")).toBeNull();
  });

  it("returns null for ES when only title_es is set (missing slug_es)", () => {
    const row = probe({ slug_es: null, title_es: "Hola" });
    expect(translationSlug(row, "es")).toBeNull();
  });

  it("is independent across locales", () => {
    const row = probe({
      slug_es: "hola",
      title_es: "Hola",
      slug_de: "hallo",
      title_de: null,
    });
    expect(translationSlug(row, "es")).toBe("hola");
    expect(translationSlug(row, "de")).toBeNull();
  });
});

describe("collectTranslations", () => {
  it("returns only locales with complete (slug, title) pairs", () => {
    const row = probe({
      slug_es: "hola",
      title_es: "Hola",
      slug_de: "hallo",
      title_de: null, // DE incomplete -> excluded
      slug_pt: "ola",
      title_pt: "Olá",
    });
    const translations = collectTranslations(row);
    expect(translations).toEqual([
      { locale: "en", slug: "hello" },
      { locale: "es", slug: "hola" },
      { locale: "pt", slug: "ola" },
    ]);
  });

  it("returns empty array when no translation is published", () => {
    const row = probe({ slug: null, title: null });
    expect(collectTranslations(row)).toEqual([]);
  });

  it("preserves EN → ES → DE → PT ordering", () => {
    const row = probe({
      slug_es: "hola",
      title_es: "Hola",
      slug_de: "hallo",
      title_de: "Hallo",
      slug_pt: "ola",
      title_pt: "Olá",
    });
    expect(collectTranslations(row).map((t) => t.locale)).toEqual(["en", "es", "de", "pt"]);
  });
});
