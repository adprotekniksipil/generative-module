"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

// Sanitize chart text to fix common Mermaid syntax issues
// Quote all square bracket labels to prevent special chars from breaking syntax
function sanitizeChart(raw: string): string {
  return raw.replace(
    /(\w+)\[([^\]"]+)\]/g,
    (_match, id, label) => {
      // Only quote if label contains problematic chars (parentheses, slashes, etc.)
      if (/[()/<>{}|&]/.test(label)) {
        return `${id}["${label}"]`;
      }
      return _match;
    }
  );
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    // Debounce rendering to avoid rendering incomplete charts during streaming
    const timer = setTimeout(async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          flowchart: { useMaxWidth: true, htmlLabels: true },
        });

        const sanitized = sanitizeChart(chart.trim());
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, sanitized);

        if (!cancelled) {
          setSvg(renderedSvg);
          setError("");
        }
      } catch (e) {
        // Clean up all Mermaid error/orphan elements from the DOM
        document
          .querySelectorAll('[id^="d"][id*="mermaid"], .mermaid-error, [id^="dmermaid"]')
          .forEach((el) => el.remove());
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Diagram error");
          setSvg("");
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [chart]);

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-medium text-amber-800 mb-2">Diagram Preview</p>
        <pre className="text-xs text-amber-700 whitespace-pre-wrap font-mono">
          {chart.trim()}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-4 flex items-center justify-center rounded-lg border bg-muted/30 p-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="my-4 overflow-x-auto rounded-lg border bg-white p-4">
      <div
        ref={containerRef}
        className="flex justify-center [&>svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
