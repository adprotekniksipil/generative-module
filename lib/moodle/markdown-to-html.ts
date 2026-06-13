import { marked } from "marked";

/**
 * Convert markdown content to clean HTML suitable for Moodle Page resources.
 * Handles: mermaid diagrams (via mermaid.ink), illustrations (via absolute URL), LaTeX math.
 *
 * Math expressions are extracted before markdown parsing to prevent marked from
 * consuming backslashes (which breaks \(...\) and \[...\] delimiters for MathJax).
 *
 * @param markdown   - Raw markdown string from the database
 * @param appBaseUrl - Base URL of this Next.js app (e.g. "http://192.168.0.144:3000")
 *                     Used to make relative illustration URLs absolute for Moodle.
 */
export async function markdownToMoodleHtml(markdown: string, appBaseUrl?: string): Promise<string> {
  let md = markdown;
  const base = appBaseUrl ? appBaseUrl.replace(/\/$/, "") : null;

  // 1. Convert mermaid code blocks → mermaid.ink image tags (before math extraction)
  md = md.replace(/```mermaid\n([\s\S]*?)```/g, (_, diagram) => {
    const encoded = Buffer.from(diagram.trim()).toString("base64url");
    const imgUrl = `https://mermaid.ink/img/${encoded}`;
    return `\n<p><img src="${imgUrl}" alt="Diagram Alur" style="max-width:100%;display:block;margin:1em auto;" /></p>\n`;
  });

  // 2. Extract math expressions into placeholders BEFORE marked parses the markdown.
  //    marked escapes backslashes (e.g. \( → (), \[ → [) which breaks MathJax delimiters.
  const mathStore: string[] = [];
  const mathPlaceholder = (i: number) => `SIVIL_MATH_${i}_END`;

  // Display math $$...$$ → \[...\]
  md = md.replace(/\$\$([\s\S]+?)\$\$/g, (_, inner) => {
    const idx = mathStore.length;
    mathStore.push(`\\[${inner}\\]`);
    return mathPlaceholder(idx);
  });

  // Inline math $...$ → \(...\)
  md = md.replace(/(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)/g, (_, inner) => {
    const idx = mathStore.length;
    mathStore.push(`\\(${inner}\\)`);
    return mathPlaceholder(idx);
  });

  // 3. Handle markdown-style illustration images ![Ilustrasi: ...](url)
  if (base) {
    md = md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
      if (!alt.toLowerCase().includes("ilustrasi")) return match;
      const absoluteUrl = url.startsWith("http") ? url : `${base}${url.startsWith("/") ? "" : "/"}${url}`;
      return `<img src="${absoluteUrl}" alt="${alt}" style="max-width:100%;display:block;margin:1em auto;" />`;
    });
    md = md.replace(/^\*?Gambar:\s*[Ii]lustrasi[^\n]*\*?$/gm, "");
    md = md.replace(/^\[?[Ii]lustrasi:[^\n]*$/gm, "");
  } else {
    md = md.replace(/!\[[^\]]*[Ii]lustrasi[^\]]*\]\([^)]*\)\n?(\*Gambar:[^\n]*\*\n?)?/g, "");
    md = md.replace(/!\[[^\]]*[Ii]lustrasi[^\]]*\]\([^)]*\)/g, "");
    md = md.replace(/^\*?Gambar:\s*[Ii]lustrasi[^\n]*\*?$/gm, "");
    md = md.replace(/^\[?[Ii]lustrasi:[^\n]*$/gm, "");
  }

  // 4. Parse markdown → HTML
  let html = await marked(md, { async: true });

  // 5. Restore math expressions (placeholders are now in the HTML, safe from marked)
  for (let i = 0; i < mathStore.length; i++) {
    html = html.replace(mathPlaceholder(i), mathStore[i]);
  }

  // 6. Post-process: handle <figure><img> illustration blocks (raw HTML embedded in markdown)
  if (base) {
    // Fix relative src in illustration img tags to absolute URL
    html = html.replace(
      /(<img\b[^>]*\bsrc=")([^"]+)("[^>]*\balt="[^"]*[Ii]lustrasi[^"]*"[^>]*>)/gi,
      (_, pre, src, post) => {
        const absoluteSrc = src.startsWith("http") ? src : `${base}${src.startsWith("/") ? "" : "/"}${src}`;
        return `${pre}${absoluteSrc}${post}`;
      }
    );
    html = html.replace(
      /(<img\b[^>]*\balt="[^"]*[Ii]lustrasi[^"]*"[^>]*\bsrc=")([^"]+)(")/gi,
      (_, pre, src, post) => {
        const absoluteSrc = src.startsWith("http") ? src : `${base}${src.startsWith("/") ? "" : "/"}${src}`;
        return `${pre}${absoluteSrc}${post}`;
      }
    );
  } else {
    html = html.replace(/<figure>\s*<img[^>]*[Ii]lustrasi[^>]*>[\s\S]*?<\/figure>/gi, "");
    html = html.replace(/<img[^>]*alt="[^"]*[Ii]lustrasi[^"]*"[^>]*>/gi, "");
  }

  html = html.replace(/<p>\s*<\/p>/g, "");

  return html;
}
