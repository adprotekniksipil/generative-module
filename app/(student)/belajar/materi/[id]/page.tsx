"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Calendar, FileText, Presentation, Paperclip } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { FilePreviewViewer } from "@/components/ui/file-preview-viewer";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTopics } from "@/contexts/topics-context";
import { parseSections } from "@/lib/utils/section-parser";

interface MaterialDetail {
  id: string;
  title: string;
  topic: string;
  subTopic: string;
  difficulty: string;
  content: string;
  wordCount: number;
  createdAt: string;
}

interface MaterialAttachment {
  id: string;
  sectionIndex: number;
  sectionHeading: string;
  filename: string;
  fileType: string;
  fileSize: number;
  url: string;
}

const difficultyLabels: Record<string, string> = {
  beginner: "Dasar",
  intermediate: "Menengah",
  advanced: "Lanjut",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentCard({
  att,
  isActive,
  onToggle,
}: {
  att: MaterialAttachment;
  isActive: boolean;
  onToggle: () => void;
}) {
  const isPdf = att.fileType === "pdf";
  const isPpt = att.fileType === "ppt" || att.fileType === "pptx";
  return (
    <div className={`rounded-xl border bg-background transition-colors ${isActive ? "border-primary/50 bg-primary/5" : ""}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {isPdf ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 shrink-0">
            <FileText className="h-4 w-4 text-red-500" />
          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 shrink-0">
            <Presentation className="h-4 w-4 text-orange-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{att.filename}</p>
          <p className="text-xs text-muted-foreground">
            {att.fileType.toUpperCase()} &bull; {formatFileSize(att.fileSize)}
          </p>
        </div>
        {(isPdf || isPpt) && (
          <button
            onClick={onToggle}
            className={`text-xs font-medium shrink-0 px-2 py-1 rounded-lg transition-colors ${
              isActive
                ? "text-primary bg-primary/10 hover:bg-primary/20"
                : "text-primary hover:bg-primary/10"
            }`}
          >
            {isActive ? "Tutup" : "Lihat"}
          </button>
        )}
        <a
          href={att.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary shrink-0"
        >
          Unduh
        </a>
      </div>
    </div>
  );
}

function SectionList({
  sections,
  attachments,
}: {
  sections: ReturnType<typeof parseSections>;
  attachments: MaterialAttachment[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeAtt = attachments.find((a) => a.id === activeId) ?? null;

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const sectionAttachments = attachments.filter(
          (a) => a.sectionIndex === section.index
        );
        return (
          <div key={section.index} className="glass-card rounded-2xl">
            <div className="px-8 py-6">
              <MarkdownRenderer content={section.fullText} />
            </div>
            {sectionAttachments.length > 0 && (
              <div className="px-8 pb-6 pt-0 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" />
                  Lampiran
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sectionAttachments.map((att) => (
                    <AttachmentCard
                      key={att.id}
                      att={att}
                      isActive={activeId === att.id}
                      onToggle={() => setActiveId(activeId === att.id ? null : att.id)}
                    />
                  ))}
                </div>
                {activeAtt && sectionAttachments.some((a) => a.id === activeAtt.id) && (
                  <FilePreviewViewer
                    url={activeAtt.url}
                    filename={activeAtt.filename}
                    fileType={activeAtt.fileType}
                    forceOpen
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StudentMaterialDetailPage() {
  const { getTopicLabel, getSubTopicLabel } = useTopics();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [attachments, setAttachments] = useState<MaterialAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/materials/${id}`).then((r) => r.json()),
      fetch(`/api/materials/${id}/attachments`).then((r) => r.ok ? r.json() : []),
    ])
      .then(([mat, atts]) => {
        setMaterial(mat);
        setAttachments(Array.isArray(atts) ? atts : []);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <>
        <Header title="Materi" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </>
    );
  }

  if (!material) {
    return (
      <>
        <Header title="Materi Tidak Ditemukan" />
        <div className="p-6">
          <div className="glass-card rounded-2xl p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Materi tidak ditemukan.</p>
            <Button variant="outline" className="rounded-xl" onClick={() => router.push("/belajar/materi")}>
              Kembali ke daftar materi
            </Button>
          </div>
        </div>
      </>
    );
  }

  const sections = parseSections(material.content);
  const hasAnyAttachment = attachments.length > 0;

  return (
    <>
      <Header title={material.title} />
      <div className="p-6 max-w-4xl space-y-4">
        <Button
          variant="ghost"
          className="rounded-xl"
          onClick={() => router.push("/belajar/materi")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
        </Button>

        {/* Meta badges */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="rounded-lg">
              {getTopicLabel(material.topic)}
            </Badge>
            <Badge variant="outline" className="rounded-lg">
              {getSubTopicLabel(material.topic, material.subTopic)}
            </Badge>
            <Badge variant="outline" className="rounded-lg">
              {difficultyLabels[material.difficulty] ?? material.difficulty}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {material.wordCount} kata
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(material.createdAt).toLocaleDateString("id-ID")}
            </span>
            {hasAnyAttachment && (
              <span className="text-xs text-amber-600 flex items-center gap-1 font-medium">
                <Paperclip className="h-3 w-3" />
                {attachments.length} lampiran
              </span>
            )}
          </div>
        </div>

        {/* Content — section by section with inline attachments */}
        <SectionList sections={sections} attachments={attachments} />
      </div>
    </>
  );
}
