import GithubSlugger from "github-slugger";

export type TocHeading = {
  depth: 2 | 3;
  text: string;
  id: string;
};

/**
 * Extract h2 and h3 headings from a markdown string.
 * Uses github-slugger — same algorithm as rehype-slug — so ids match the
 * anchors produced by the markdown renderer.
 *
 * Skips content inside fenced code blocks to avoid treating `## foo` comments
 * as headings.
 */
export function extractToc(markdown: string): TocHeading[] {
  if (!markdown) return [];

  const slugger = new GithubSlugger();
  const headings: TocHeading[] = [];

  const lines = markdown.split(/\r?\n/);
  let inFence = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    const depth = match[1].length as 2 | 3;
    // Strip inline markdown formatting (**bold**, *em*, `code`, [text](url))
    const text = match[2]
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[*_`]/g, "")
      .trim();

    if (!text) continue;

    headings.push({
      depth,
      text,
      id: slugger.slug(text),
    });
  }

  return headings;
}
