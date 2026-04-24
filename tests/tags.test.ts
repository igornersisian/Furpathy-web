import { describe, it, expect } from "vitest";
import { slugifyTag } from "@/lib/tags";

describe("slugifyTag", () => {
  it("lowercases", () => {
    expect(slugifyTag("Dogs")).toBe("dogs");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugifyTag("senior dogs")).toBe("senior-dogs");
  });

  it("strips accents (NFD fold)", () => {
    expect(slugifyTag("Comportamento Canino")).toBe("comportamento-canino");
    expect(slugifyTag("Alimentación")).toBe("alimentacion");
    expect(slugifyTag("Ernährung")).toBe("ernahrung");
  });

  it("collapses multiple separators", () => {
    expect(slugifyTag("cat  &  dog")).toBe("cat-dog");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugifyTag("  -- cat --  ")).toBe("cat");
  });

  it("strips punctuation", () => {
    expect(slugifyTag("dogs, cats & rabbits!")).toBe("dogs-cats-rabbits");
  });

  it("returns empty string for punctuation-only input", () => {
    expect(slugifyTag("---")).toBe("");
    expect(slugifyTag("!!!")).toBe("");
  });

  it("is idempotent on already-slugified input", () => {
    const slug = slugifyTag("Senior Dogs");
    expect(slugifyTag(slug)).toBe(slug);
  });
});
