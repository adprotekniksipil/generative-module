"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Trash2, Loader2, BookOpen, Calendar, Save, Eye, EyeOff, FileText, Tag, Globe2, BookMarked } from "lucide-react";
import { VisibilitySelector } from "@/components/visibility/visibility-selector";
import { SectionEditor } from "@/components/editor/section-editor";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useTopics } from "@/contexts/topics-context";

interface MaterialDetail {
  id: string;
  title: string;
  topic: string;
  subTopic: string;
  language: string;
  difficulty: string;
  depth: string;
  content: string;
  sourceType: string;
  wordCount: number;
  isPublished: boolean;
  createdAt: string;
  groups?: { groupId: string }[];
}

const difficultyLabels: Record<string, string> = {
  beginner: "Dasar",
  intermediate: "Menengah",
  advanced: "Lanjut",
};

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 border-emerald-200",
  intermediate: "bg-amber-100 text-amber-700 border-amber-200",
  advanced: "bg-rose-100 text-rose-700 border-rose-200",
};

const languageLabels: Record<string, string> = {
  id: "Bahasa Indonesia",
  en: "English",
};

const depthLabels: Record<string, string> = {
  overview: "Overview",
  standard: "Standar",
  deep: "Mendalam",
};

export default function MaterialDetailPage() {
  const { getTopicLabel, getSubTopicLabel } = useTopics();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);

  useEffect(() => {
    fetch(`/api/materials/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setMaterial(data);
        setIsPublished(data.isPublished ?? false);
        setSelectedGroupIds(data.groups?.map((g: { groupId: string }) => g.groupId) ?? []);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Hapus materi ini?")) return;
    try {
      await fetch(`/api/materials/${id}`, { method: "DELETE" });
      toast.success("Materi berhasil dihapus");
      router.push("/materials");
    } catch {
      toast.error("Gagal menghapus materi");
    }
  };

  const handleSaveEdits = async () => {
    if (!material || !editedContent) return;
    setIsSaving(true);
    try {
      const titleMatch = editedContent.match(/^#\s+(.+)$/m);
      const title = titleMatch?.[1] ?? material.title;

      const res = await fetch(`/api/materials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: editedContent }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      const updated = await res.json();
      setMaterial({ ...material, ...updated, content: editedContent, title });
      setEditedContent(null);
      toast.success("Perubahan berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan perubahan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (format: "pdf" | "docx") => {
    if (!material) return;
    setIsExporting(true);
    try {
      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "material",
          title: material.title,
          content: material.content,
        }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${material.title}.${format === "pdf" ? "pdf" : "docx"}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Berhasil export ke ${format.toUpperCase()}`);
    } catch {
      toast.error(`Gagal export ke ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMbz = async () => {
    if (!material) return;
    setIsExporting(true);
    try {
      const res = await fetch("/api/export/mbz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "material", id: material.id }),
      });
      if (!res.ok) throw new Error("Export MBZ failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${material.title}.mbz`; a.click();
      URL.revokeObjectURL(url);
      toast.success("MBZ berhasil didownload");
    } catch {
      toast.error("Gagal export MBZ");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveVisibility = async () => {
    if (!material) return;
    setIsSavingVisibility(true);
    try {
      const res = await fetch(`/api/materials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished, groupIds: selectedGroupIds }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      const updated = await res.json();
      setMaterial({ ...material, ...updated });
      toast.success("Pengaturan visibilitas berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan pengaturan visibilitas");
    } finally {
      setIsSavingVisibility(false);
    }
  };

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
            <Button variant="outline" className="rounded-xl" onClick={() => router.push("/materials")}>
              Kembali ke daftar materi
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>

      <Header title={material.title} />
      <div className="p-6 max-w-4xl space-y-4">
        {/* Action bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/materials")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Daftar Materi
          </button>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="rounded-xl gap-1.5" disabled={isExporting}>
                    {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    Export
                  </Button>
                }
              />
              <DropdownMenuContent className="rounded-xl">
                <DropdownMenuItem onClick={() => handleExport("pdf")}>Export PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("docx")}>Export Word</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportMbz()}>Download MBZ (Moodle)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" className="rounded-xl gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              Hapus
            </Button>
          </div>
        </div>

        {/* Meta card */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          {/* Header row: judul + published status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-sm leading-snug">{material.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{getTopicLabel(material.topic)} · {getSubTopicLabel(material.topic, material.subTopic)}</p>
              </div>
            </div>
            <div className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isPublished
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-muted text-muted-foreground border-border"
            }`}>
              {isPublished ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {isPublished ? "Dipublikasi" : "Draf"}
            </div>
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${difficultyColors[material.difficulty] ?? "bg-muted text-muted-foreground border-border"}`}>
              {difficultyLabels[material.difficulty] ?? material.difficulty}
            </span>
            {material.depth && (
              <Badge variant="outline" className="rounded-lg gap-1 text-xs">
                <FileText className="h-3 w-3" />
                {depthLabels[material.depth] ?? material.depth}
              </Badge>
            )}
            <Badge variant="outline" className="rounded-lg gap-1 text-xs">
              <Globe2 className="h-3 w-3" />
              {languageLabels[material.language] ?? material.language}
            </Badge>
            {material.sourceType !== "topic" && (
              <Badge variant="secondary" className="rounded-lg text-xs">
                {material.sourceType === "file" ? "Upload File" : "Dari URL"}
              </Badge>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 pt-1 border-t border-border/50 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BookMarked className="h-3.5 w-3.5" />
              {material.wordCount} kata
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(material.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Visibility & Group Assignment */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Visibilitas & Kelas</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Atur siapa yang bisa melihat materi ini</p>
            </div>
          </div>
          <VisibilitySelector
            isPublished={isPublished}
            selectedGroupIds={selectedGroupIds}
            onPublishChange={setIsPublished}
            onGroupsChange={setSelectedGroupIds}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              className="rounded-xl gap-1.5"
              onClick={handleSaveVisibility}
              disabled={isSavingVisibility}
            >
              {isSavingVisibility ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Simpan Visibilitas
            </Button>
          </div>
        </div>

        {editedContent && (
          <div className="sticky bottom-4 z-10">
            <div className="glass-card rounded-xl px-4 py-3 flex items-center justify-between shadow-lg border border-primary/20 bg-primary/5">
              <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                <Save className="h-3.5 w-3.5" />
                Ada perubahan yang belum disimpan
              </p>
              <Button
                size="sm"
                className="rounded-xl gap-1.5 text-xs"
                onClick={handleSaveEdits}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Simpan Perubahan
              </Button>
            </div>
          </div>
        )}

        {/* Content — Notion-like editor */}
        <div>
          <SectionEditor
            content={editedContent ?? material.content}
            materialTitle={material.title}
            difficulty={material.difficulty}
            language={material.language}
            onContentChange={setEditedContent}
            materialId={material.id}
          />
        </div>
      </div>
    </>
  );
}
