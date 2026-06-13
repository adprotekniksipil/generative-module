"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { MermaidDiagram } from "./mermaid-diagram";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
        crossOrigin="anonymous"
      />
      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold mt-8 mb-4 pb-2 border-b">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold mt-6 mb-3 pb-1.5 border-b border-border/50">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold mt-5 mb-2">{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-base font-semibold mt-4 mb-2">{children}</h4>
            ),
            p: ({ children }) => {
              // If children contain block-level elements (like figure/img), use div instead of p
              const hasBlockChild = React.Children.toArray(children).some(
                (child) =>
                  React.isValidElement(child) &&
                  (child.type === "figure" ||
                    child.type === "img" ||
                    (typeof child.type === "function" &&
                      child.props &&
                      "src" in (child.props as Record<string, unknown>)))
              );
              if (hasBlockChild) {
                return <div className="my-3 leading-7 text-[15px]">{children}</div>;
              }
              return <p className="my-3 leading-7 text-[15px]">{children}</p>;
            },
            ul: ({ children }) => (
              <ul className="my-3 ml-6 list-disc space-y-1.5">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="my-3 ml-6 list-decimal space-y-1.5">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="leading-7 text-[15px]">{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="my-4 border-l-4 border-primary/30 bg-primary/5 pl-4 py-2 italic rounded-r">
                {children}
              </blockquote>
            ),
            code: ({ className, children, ...props }) => {
              // Detect mermaid code blocks
              const isMermaid = className === "language-mermaid";
              if (isMermaid) {
                const chart = String(children).replace(/\n$/, "");
                return <MermaidDiagram chart={chart} />;
              }

              const isInline = !className;
              if (isInline) {
                return (
                  <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-primary">
                    {children}
                  </code>
                );
              }
              return (
                <code className={`${className} text-sm`} {...props}>
                  {children}
                </code>
              );
            },
            pre: ({ children }) => {
              // If child is a MermaidDiagram, render without pre wrapper
              const child = React.Children.only(children) as React.ReactElement;
              if (child?.type === MermaidDiagram) {
                return <>{children}</>;
              }
              return (
                <pre className="my-4 overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-50">
                  {children}
                </pre>
              );
            },
            table: ({ children }) => (
              <div className="my-4 overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-muted/50 border-b">{children}</thead>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2.5 text-left font-semibold">{children}</th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2.5 border-t">{children}</td>
            ),
            hr: () => <hr className="my-6 border-border" />,
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-primary underline underline-offset-2 hover:text-primary/80"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            figure: ({ children }) => (
              <figure className="my-4">{children}</figure>
            ),
            figcaption: ({ children }) => (
              <figcaption className="mt-2 text-center text-xs text-muted-foreground">{children}</figcaption>
            ),
            img: ({ src, alt }) => {
              // Render a plain img — the outer <figure>/<figcaption> from raw HTML
              // already provides the wrapper and caption, so we must NOT add another one.
              const srcStr = typeof src === "string" ? src : "";
              const isRealImage =
                srcStr &&
                (srcStr.startsWith("http://") ||
                  srcStr.startsWith("https://") ||
                  srcStr.startsWith("data:") ||
                  srcStr.startsWith("/"));

              if (isRealImage) {
                // eslint-disable-next-line @next/next/no-img-element
                return (
                  <img
                    src={src}
                    alt={alt || "Ilustrasi"}
                    className="rounded-lg border max-w-full h-auto mx-auto"
                  />
                );
              }

              // Placeholder for images without a real src
              return (
                <span className="block rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground italic">
                  [Ilustrasi: {alt || "Gambar"}]
                </span>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </>
  );
}
