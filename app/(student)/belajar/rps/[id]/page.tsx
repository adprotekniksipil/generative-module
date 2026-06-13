"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ScrollText,
  FileText,
  FileSpreadsheet,
  Presentation,
  Download,
  Eye,
  Calendar,
  BookOpen,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FilePreviewViewer } from "@/components/ui/file-preview-viewer";

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
  createdAt: string;
  createdBy: { name: string };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ fileType }: { fileType: string }) {
  if (fileType === "pdf")
    return <FileText className="h-6 w-6 text-red-500" />;
  if (fileType === "xls" || fileType === "xlsx")
    return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
  return <Presentation className="h-6 w-6 text-orange-500" />;
}

function fileBgColor(fileType: string) {
  if (fileType === "pdf") return "bg-red-500/10";
  if (fileType === "xls" || fileType === "xlsx") return "bg-green-500/10";
  return "bg-orange-500/10";
}

export default function StudentRPSDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rps, setRps] = useState<RPSDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetch(`/api/rps/${id}`)
      .then((r) => r.json())
      .then((data) => setRps(data.error ? null : data))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <>
        <Header title="RPS" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </>
    );
  }

  if (!rps) {
    return (
      <>
        <Header title="RPS Tidak Ditemukan" />
        <div className="p-6">
          <div className="glass-card rounded-2xl p-8 text-center">
            <ScrollText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">RPS tidak ditemukan.</p>
            <Button variant="outline" className="rounded-xl" onClick={() => router.push("/belajar/rps")}>
              Kembali ke daftar RPS
            </Button>
          </div>
        </div>
      </>
    );
  }

  const canPreview = rps.fileUrl && rps.fileType && (rps.fileType === "pdf" || rps.fileType === "ppt" || rps.fileType === "pptx");

  return (
    <>
      <Header title={rps.courseName} />
      <div className="p-6 max-w-3xl space-y-4">
        <Button variant="ghost" className="rounded-xl" onClick={() => router.push("/belajar/rps")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
        </Button>

        {/* Header card */}
        <div className="glass-card rounded-2xl p-6 space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 shrink-0">
              <ScrollText className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg leading-tight">{rps.courseName}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{rps.title}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {rps.courseCode && (
              <Badge variant="secondary" className="rounded-lg font-mono">{rps.courseCode}</Badge>
            )}
            <Badge variant="outline" className="rounded-lg">{rps.credits} SKS</Badge>
            <Badge variant="outline" className="rounded-lg">Semester {rps.semester} {rps.semesterType}</Badge>
            <Badge variant="outline" className="rounded-lg">{rps.academicYear}</Badge>
          </div>
        </div>

        {/* Info */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold">Informasi Mata Kuliah</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Program Studi</p>
              <p className="font-medium mt-0.5">{rps.program}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dosen Pengampu</p>
              <p className="font-medium mt-0.5">{rps.createdBy.name}</p>
            </div>
            {rps.prerequisite && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Prasyarat</p>
                <p className="font-medium mt-0.5">{rps.prerequisite}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Diunggah
              </p>
              <p className="font-medium mt-0.5">
                {new Date(rps.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* File card */}
        {rps.fileUrl ? (
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold">Dokumen RPS</h3>
            <div className="flex items-center gap-4 rounded-xl border bg-background p-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${fileBgColor(rps.fileType ?? "")}`}>
                <FileIcon fileType={rps.fileType ?? ""} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{rps.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {(rps.fileType ?? "").toUpperCase()}
                  {rps.fileSize ? ` • ${formatFileSize(rps.fileSize)}` : ""}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {canPreview && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1.5"
                    onClick={() => setShowPreview((v) => !v)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {showPreview ? "Tutup" : "Lihat"}
                  </Button>
                )}
                <a href={rps.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Unduh
                  </Button>
                </a>
              </div>
            </div>

            {canPreview && showPreview && (
              <FilePreviewViewer
                url={rps.fileUrl}
                filename={rps.fileName ?? ""}
                fileType={rps.fileType ?? ""}
                forceOpen
              />
            )}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Belum ada dokumen RPS yang diunggah.</p>
          </div>
        )}
      </div>
    </>
  );
}
