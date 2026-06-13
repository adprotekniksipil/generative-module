"use client";

import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Skeleton } from "@/components/ui/skeleton";

interface StreamingOutputProps {
  content: string;
  isLoading: boolean;
}

export function StreamingOutput({ content, isLoading }: StreamingOutputProps) {
  if (!content && !isLoading) return null;

  if (!content && isLoading) {
    return (
      <div className="glass-card rounded-2xl p-8 space-y-3">
        <Skeleton className="h-7 w-2/3 rounded-lg" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-5/6 rounded-lg" />
        <Skeleton className="h-4 w-4/5 rounded-lg" />
        <div className="pt-2" />
        <Skeleton className="h-5 w-1/2 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {isLoading && (
        <div className="flex items-center gap-2 border-b border-border/50 px-6 py-3 text-sm text-muted-foreground">
          <div className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          Sedang men-generate materi...
        </div>
      )}
      <div className="px-8 py-6">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
