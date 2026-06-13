"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewViewerProps {
  url: string;        // relative URL, e.g. /attachments/materialId/file.pptx
  filename: string;
  fileType: string;   // "pdf" | "ppt" | "pptx"
  /** Jika true, tampilkan viewer langsung tanpa toggle button (dikontrol dari luar) */
  forceOpen?: boolean;
}

export function FilePreviewViewer({ url, filename, fileType, forceOpen }: FilePreviewViewerProps) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const isPdf = fileType === "pdf";
  const isPpt = fileType === "ppt" || fileType === "pptx";
  const isVisible = forceOpen ?? open;

  function getEmbedUrl() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const absolute = `${origin}${url}`;
    if (isPdf) return url;
    if (isPpt) return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absolute)}`;
    return url;
  }

  if (!isPdf && !isPpt) return null;

  return (
    <div className="space-y-2">
      {/* Toggle button hanya ditampilkan jika tidak forceOpen */}
      {!forceOpen && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 rounded-lg text-xs gap-1.5 text-primary hover:text-primary"
          onClick={() => { setOpen((v) => !v); setLoaded(false); }}
        >
          {open ? (
            <><EyeOff className="h-3.5 w-3.5" /> Tutup Pratinjau</>
          ) : (
            <><Eye className="h-3.5 w-3.5" /> Lihat {isPdf ? "PDF" : "Presentasi"}</>
          )}
        </Button>
      )}

      {isVisible && (
        <div className="relative rounded-xl border overflow-hidden bg-muted/30">
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 z-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Memuat {filename}…</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 hover:underline mt-1"
              >
                <ExternalLink className="h-3 w-3" />
                Buka di tab baru
              </a>
            </div>
          )}
          <iframe
            src={getEmbedUrl()}
            title={filename}
            width="100%"
            height={isPdf ? 600 : 520}
            className="block"
            onLoad={() => setLoaded(true)}
            allow="fullscreen"
          />
        </div>
      )}
    </div>
  );
}
