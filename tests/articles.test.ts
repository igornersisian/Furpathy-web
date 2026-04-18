import { describe, it, expect } from "vitest";
import { mapRow } from "@/lib/articles";
import type { ArticleRow } from "@/lib/types";

function baseRow(overrides: Partial<ArticleRow> = {}): ArticleRow {
  return {
    id: "1",
    slug: "hello-world",
    title: "Hello World",
    meta_description: "EN description",
    tags: ["dogs", "care"],
    content_en: "English content body with enough words to compute a reading time.",
    title_es: null,
    slug_es: null,
    meta_description_es: null,
    tags_es: null,
    content_es: null,
    title_de: null,
    slug_de: null,
    meta_description_de: null,
    tags_de: null,
    content_de: null,
    title_pt: null,
    slug_pt: null,
    meta_description_pt: null,
    tags_pt: null,
    content_pt: null,
    image_url: null,
    status: "published",
    medium_url: null,
    created_at: "2026-01-01T00:00:00Z",
    published_at: "2026-01-02T00:00:00Z",
    ...overrides,
  };
}

describe("mapRow", () => {
  it("returns EN fields when locale is en", () => {
    const article = mapRow(baseRow(), "en");
    expect(article).not.toBeNull();
    expect(article!.title).toBe("Hello World");
    expect(article!.slug).toBe("hello-world");
    expect(article!.content).toContain("English content");
    expect(article!.tags).toEqual(["dogs", "care"]);
    expect(article!.readingTimeMin).toBeGreaterThanOrEqual(1);
  });

  it("returns null when a localized translation is missing", () => {
    const article = mapRow(baseRow(), "es");
    expect(article).toBeNull();
  });

  it("uses localized fields when a translation is present", () => {
    const row = baseRow({
      title_es: "Hola Mundo",
      slug_es: "hola-mundo",
      meta_description_es: "ES description",
      tags_es: ["perros"],
      content_es: "Contenido en español con suficientes palabras para calcular tiempo.",
    });
    const article = mapRow(row, "es");
    expect(article).not.toBeNull();
    expect(article!.title).toBe("Hola Mundo");
    expect(article!.slug).toBe("hola-mundo");
    expect(article!.description).toBe("ES description");
    expect(article!.tags).toEqual(["perros"]);
    expect(article!.content).toContain("español");
  });

  it("returns null when localized title exists but content is missing", () => {
    const row = baseRow({ title_es: "Hola", content_es: null });
    const article = mapRow(row, "es");
    expect(article).toBeNull();
  });

  it("returns null when localized content and slug exist but title is missing", () => {
    const row = baseRow({
      slug_es: "hola",
      content_es: "Contenido suficiente para calcular.",
      title_es: null,
    });
    const article = mapRow(row, "es");
    expect(article).toBeNull();
  });

  it("defaults title to Untitled when EN title is null", () => {
    const row = baseRow({ title: null });
    const article = mapRow(row, "en");
    expect(article).not.toBeNull();
    expect(article!.title).toBe("Untitled");
  });

  it("exposes createdAt so UI can fall back to it when publishedAt is null", () => {
    const row = baseRow({ published_at: null });
    const article = mapRow(row, "en");
    expect(article).not.toBeNull();
    expect(article!.publishedAt).toBeNull();
    expect(article!.createdAt).toBe("2026-01-01T00:00:00Z");
  });

  it("returns null when EN content is missing entirely", () => {
    const row = baseRow({ content_en: null });
    const article = mapRow(row, "en");
    expect(article).toBeNull();
  });
});
