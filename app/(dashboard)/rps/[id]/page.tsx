"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  BookMarked,
  Calendar,
  GraduationCap,
  Trash2,
  Pencil,
  Download,
  FileText,
  FileSpreadsheet,
  Users,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RPSDetail {
  id: string;
  title: string;
  courseName: string;
  courseCode: string | null;
  credits: number;
  semester: number;
  semesterType: string;
  academicYear: string;
  prerequisite: string | null;
  program: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  isPublished: boolean;
  createdAt: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type }: { type: string | null }) {
  if (type === "pdf") return <FileText className="h-8 w-8 text-red-500" />;
  if (type === "xlsx" || type === "xls") return <FileSpreadsheet className="h-8 w-8 text-emerald-600" />;
  return <FileText className="h-8 w-8 text-blue-500" />;
}

function fileTypeLabel(type: string | null) {
  if (!type) return "File";
  const map: Record<string, string> = {
    pdf: "PDF",
    doc: "Word Document",
    docx: "Word Document",
    xls: "Excel Spreadsheet",
    xlsx: "Excel Spreadsheet",
  };
  return map[type] ?? type.toUpperCase();
}

export default function RPSDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rps, setRps] = useState<RPSDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/rps/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setRps)
      .catch(() => toast.error("Gagal memuat RPS"))
      .finally(() => setIsLoading(false));
  }, [id]);

  const [isExportingMbz, setIsExportingMbz] = useState(false);

  const handleExportMbz = async () => {
    if (!rps) return;
    setIsExportingMbz(true);
    try {
      const res = await fetch("/api/export/mbz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "rps", id: rps.id }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `RPS_${rps.title}.mbz`; a.click();
      URL.revokeObjectURL(url);
      toast.success("MBZ berhasil didownload");
    } catch {
      toast.error("Gagal export MBZ");
    } finally {
      setIsExportingMbz(false);
    }
  };

  const handleDelete = async () => {
    if (!rps || !confirm(`Hapus RPS "${rps.title}"?`)) return;
    try {
      const res = await fetch(`/api/rps/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("RPS berhasil dihapus");
      router.push("/rps");
    } catch {
      toast.error("Gagal menghapus RPS");
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="RPS" />
        <div className="p-6 flex items-center justify-center min-h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (!rps) {
    return (
      <>
        <Header title="RPS" />
        <div className="p-6">
          <p className="text-muted-foreground">RPS tidak ditemukan.</p>
          <Link href="/rps" className={cn(buttonVariants({ variant: "ghost" }), "mt-3 rounded-xl gap-1.5")}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </div>
      </>
    );
  }

  return (
    <>

      <Header title={rps.title} />
      <div className="p-6 max-w-3xl space-y-5">
        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <Link href="/rps" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-xl gap-1.5 text-xs")}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Daftar RPS
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={handleExportMbz} disabled={isExportingMbz}>
              {isExportingMbz ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              MBZ
            </Button>
<Link href={`/rps/${id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl gap-1.5 text-xs")}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus
            </Button>
          </div>
        </div>

        {/* Identitas */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold">{rps.title}</h1>
                {rps.courseCode && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-mono">
                    {rps.courseCode}
                  </span>
                )}
                {rps.isPublished && (
                  <Badge variant="default" className="rounded-md text-[10px]">Dipublikasi</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{rps.courseName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Program Studi</p>
              <div className="flex items-center gap-1.5 text-sm">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                <span>{rps.program}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">SKS</p>
              <div className="flex items-center gap-1.5 text-sm">
                <BookMarked className="h-3.5 w-3.5 text-primary" />
                <span>{rps.credits} SKS</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Semester</p>
              <div className="flex items-center gap-1.5 text-sm">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>Semester {rps.semester}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Tahun Akademik</p>
              <div className="flex items-center gap-1.5 text-sm">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>{rps.semesterType} {rps.academicYear}</span>
              </div>
            </div>
          </div>

          {rps.prerequisite && (
            <p className="text-sm">
              <span className="text-muted-foreground">Prasyarat: </span>
              <span className="font-medium">{rps.prerequisite}</span>
            </p>
          )}
        </div>

        {/* File */}
        {rps.fileUrl ? (
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold">Dokumen RPS</h2>
            <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/20">
              <div className="flex-shrink-0">
                <FileIcon type={rps.fileType} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{rps.fileName ?? "RPS Document"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {fileTypeLabel(rps.fileType)}
                  {rps.fileSize ? ` · ${formatBytes(rps.fileSize)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={rps.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border hover:bg-accent"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Buka
                </a>
                <a
                  href={rps.fileUrl}
                  download={rps.fileName ?? true}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors px-3 py-1.5 rounded-lg"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 flex flex-col items-center text-center gap-2">
            <FileText className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Belum ada file yang diunggah</p>
            <Link href={`/rps/${id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl gap-1.5 text-xs mt-1")}>
              <Pencil className="h-3.5 w-3.5" />
              Upload File
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
