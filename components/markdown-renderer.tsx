import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-lg prose-article mx-auto max-w-[680px] dark:prose-invert prose-headings:font-display prose-headings:tracking-tight prose-a:text-[color:var(--accent)] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-blockquote:border-l-[color:var(--accent)]">
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
