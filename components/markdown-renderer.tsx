// Server-only in practice: react-markdown + remark/rehype plugins (~50 KB
// gzipped) should never land in a client bundle. Do NOT add "use client" to
// this file, and only import it from server components (no `use client` in
// the caller or its ancestor). The sole current caller is the article page.
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-lg prose-article prose-headings:font-display prose-headings:tracking-tight prose-headings:font-medium prose-a:text-[color:var(--accent)] prose-a:no-underline hover:prose-a:underline prose-img:rounded-sm prose-blockquote:border-l-[color:var(--accent)] prose-blockquote:font-display prose-blockquote:not-italic prose-blockquote:text-[color:var(--foreground)] max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap", properties: { className: ["anchor"] } }],
        ]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
