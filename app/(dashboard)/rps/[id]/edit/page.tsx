"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Save,
  Upload,
  FileText,
  FileSpreadsheet,
  X,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { VisibilitySelector } from "@/components/visibility/visibility-selector";

interface RPSMeta {
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
  groups: { groupId: string }[];
}

const CURRENT_YEAR = new Date().getFullYear();
const ACADEMIC_YEARS = Array.from({ length: 3 }, (_, i) => {
  const y = CURRENT_YEAR + i - 1;
  return `${y}/${y + 1}`;
});
const ALLOWED_EXTS = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];
const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string | null) {
  if (type === "pdf") return <FileText className="h-5 w-5 text-red-500" />;
  if (type === "xlsx" || type === "xls") return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
  return <FileText className="h-5 w-5 text-blue-500" />;
}

export default function EditRPSPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Metadata fields
  const [title, setTitle] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [credits, setCredits] = useState(3);
  const [semester, setSemester] = useState(3);
  const [semesterType, setSemesterType] = useState("Ganjil");
  const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[1]);
  const [prerequisite, setPrerequisite] = useState("");

  // Visibility
  const [isPublished, setIsPublished] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // File state
  const [currentFile, setCurrentFile] = useState<{ url: string; name: string | null; type: string | null; size: number | null } | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetch(`/api/rps/${id}`)
      .then(async (r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: RPSMeta) => {
        setTitle(data.title);
        setCourseName(data.courseName);
        setCourseCode(data.courseCode ?? "");
        setCredits(data.credits);
        setSemester(data.semester);
        setSemesterType(data.semesterType);
        setAcademicYear(data.academicYear);
        setPrerequisite(data.prerequisite ?? "");
        setIsPublished(data.isPublished ?? false);
        setSelectedGroupIds(data.groups?.map((g) => g.groupId) ?? []);
        if (data.fileUrl) {
          setCurrentFile({ url: data.fileUrl, name: data.fileName, type: data.fileType, size: data.fileSize });
        }
      })
      .catch(() => toast.error("Gagal memuat RPS"))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleFileSelect = (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_MIME.includes(file.type)) {
      toast.error("Hanya file PDF, Word (.doc/.docx), dan Excel (.xls/.xlsx)");
      return;
    }
    if (file.size > 20 * 1024 * 1024) { toast.error("Ukuran file maksimal 20MB"); return; }
    setNewFile(file);
  };

  const handleSave = async () => {
    if (!courseName.trim()) { toast.error("Nama mata kuliah wajib diisi"); return; }

    let filePayload: Record<string, string | number | null> = {};

    if (newFile) {
      // Upload new file first
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", newFile);
        const res = await fetch("/api/rps/upload", { method: "POST", body: formData });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Gagal upload"); }
        const uploaded = await res.json();
        filePayload = {
          fileUrl: uploaded.url,
          fileName: uploaded.fileName,
          fileType: uploaded.fileType,
          fileSize: uploaded.fileSize,
        };
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal upload file");
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/rps/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || `RPS - ${courseName}`,
          courseName,
          courseCode: courseCode || undefined,
          credits,
          semester,
          semesterType,
          academicYear,
          prerequisite: prerequisite || undefined,
          program: "Teknik Sipil",
          ...filePayload,
          cpl: [],
          cpmk: [],
          weeks: [],
          description: "",
          isPublished,
          groupIds: selectedGroupIds,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("RPS berhasil disimpan");
      router.push(`/rps/${id}`);
    } catch {
      toast.error("Gagal menyimpan RPS");
    } finally {
      setIsSaving(false);
    }
  };

  const busy = isUploading || isSaving;

  if (isLoading) {
    return (
      <>
        <Header title="Edit RPS" />
        <div className="p-6 flex items-center justify-center min-h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Edit RPS" />
      <div className="p-6 max-w-2xl space-y-5">
        <Link href={`/rps/${id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-xl gap-1.5 text-xs")}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Detail
        </Link>

        {/* Identitas */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold">Identitas Mata Kuliah</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Judul RPS</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" disabled={busy} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Nama Mata Kuliah <span className="text-destructive">*</span></Label>
              <Input value={courseName} onChange={(e) => setCourseName(e.target.value)} className="rounded-xl" disabled={busy} />
            </div>
            <div className="space-y-2">
              <Label>Kode Mata Kuliah</Label>
              <Input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="contoh: SIP301" className="rounded-xl" disabled={busy} />
            </div>
            <div className="space-y-2">
              <Label>Jumlah SKS</Label>
              <Select value={String(credits)} onValueChange={(v) => v && setCredits(Number(v))} disabled={busy}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{[1,2,3,4].map((c) => <SelectItem key={c} value={String(c)}>{c} SKS</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semester Ke-</Label>
              <Select value={String(semester)} onValueChange={(v) => v && setSemester(Number(v))} disabled={busy}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{[1,2,3,4,5,6,7,8].map((s) => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jenis Semester</Label>
              <Select value={semesterType} onValueChange={(v) => v && setSemesterType(v)} disabled={busy}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ganjil">Ganjil</SelectItem>
                  <SelectItem value="Genap">Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tahun Akademik</Label>
              <Select value={academicYear} onValueChange={(v) => v && setAcademicYear(v)} disabled={busy}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{ACADEMIC_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Prasyarat</Label>
              <Input value={prerequisite} onChange={(e) => setPrerequisite(e.target.value)} placeholder="Tidak ada" className="rounded-xl" disabled={busy} />
            </div>
          </div>
        </div>

        {/* File */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold">File RPS</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Format: PDF, Word (.doc/.docx), Excel (.xls/.xlsx) · Maks. 20MB
            </p>
          </div>

          {/* Current file */}
          {currentFile && !newFile && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">File Saat Ini</p>
              <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20">
                <div className="flex-shrink-0">{fileIcon(currentFile.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{currentFile.name ?? "RPS Document"}</p>
                  {currentFile.size && <p className="text-xs text-muted-foreground">{formatBytes(currentFile.size)}</p>}
                </div>
                <a href={currentFile.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex-shrink-0">
                  Lihat
                </a>
              </div>
            </div>
          )}

          {/* New file selected */}
          {newFile && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">File Baru</p>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                <div className="flex-shrink-0">{fileIcon(newFile.name.split(".").pop()?.toLowerCase() ?? null)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{newFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(newFile.size)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <button type="button" onClick={() => { setNewFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-muted-foreground hover:text-destructive transition-colors" disabled={busy}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Drop zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/20"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center">
              {currentFile ? "Klik atau seret untuk ganti file" : "Klik atau seret file ke sini"}
            </p>
            <input ref={fileInputRef} type="file" className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
          </div>
        </div>

        {/* Visibility */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold">Visibilitas & Kelas</h3>
          <VisibilitySelector
            isPublished={isPublished}
            selectedGroupIds={selectedGroupIds}
            onPublishChange={setIsPublished}
            onGroupsChange={setSelectedGroupIds}
          />
        </div>

        {/* Save */}
        <Button onClick={handleSave} disabled={busy} size="lg" className="w-full rounded-xl h-12 text-sm gap-2">
          {isUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Mengunggah file...</>
            : isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
            : <><Save className="h-4 w-4" /> Simpan Perubahan</>}
        </Button>
      </div>
    </>
  );
}
