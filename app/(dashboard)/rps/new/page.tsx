"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  Upload,
  FileText,
  FileSpreadsheet,
  X,
  CheckCircle2,
  CloudUpload,
  RefreshCw,
  BookOpen,
  ClipboardList,
  Eye,
  GraduationCap,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
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
import { TopicSelector } from "@/components/generation/topic-selector";

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

const FILE_FORMAT_BADGES = [
  { label: "PDF", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  { label: "DOC", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { label: "DOCX", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { label: "XLS", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { label: "XLSX", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
];

function getFileExt(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function fileIcon(type: string, size: "sm" | "lg" = "sm") {
  const dim = size === "lg" ? "h-10 w-10" : "h-5 w-5";
  if (type === "pdf") return <FileText className={`${dim} text-red-500`} />;
  if (type === "xlsx" || type === "xls") return <FileSpreadsheet className={`${dim} text-emerald-600`} />;
  return <FileText className={`${dim} text-blue-500`} />;
}

function fileTypeBadge(ext: string) {
  const badge = FILE_FORMAT_BADGES.find((b) => b.label === ext.toUpperCase());
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${badge?.className ?? "bg-muted text-muted-foreground"}`}>
      {ext.toUpperCase()}
    </span>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface StepHeaderProps {
  number: number;
  title: string;
  description: string;
  badge?: React.ReactNode;
  icon: React.ReactNode;
}

function StepHeader({ number, title, description, badge, icon }: StepHeaderProps) {
  return (
    <div className="flex items-center gap-2.5 mb-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
        {number}
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {icon}
        <h4 className="text-sm font-semibold">{title}</h4>
        {badge}
      </div>
    </div>
  );
}

interface StepDescriptionProps {
  children: React.ReactNode;
}

function StepDescription({ children }: StepDescriptionProps) {
  return (
    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{children}</p>
  );
}

export default function NewRPSPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [topic, setTopic] = useState("");
  const [subTopic, setSubTopic] = useState("");

  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [credits, setCredits] = useState(3);
  const [semester, setSemester] = useState(3);
  const [semesterType, setSemesterType] = useState<"Ganjil" | "Genap">("Ganjil");
  const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[1]);
  const [prerequisite, setPrerequisite] = useState("");

  const [isPublished, setIsPublished] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileSelect = (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_MIME.includes(file.type)) {
      toast.error("Hanya file PDF, Word (.doc/.docx), dan Excel (.xls/.xlsx)");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 20MB");
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async () => {
    if (!courseName.trim()) { toast.error("Nama mata kuliah wajib diisi"); return; }
    if (!selectedFile) { toast.error("Pilih file RPS terlebih dahulu"); return; }

    setIsUploading(true);
    let fileUrl = "";
    let fileType = "";
    let fileSize = 0;
    let fileName = "";

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const uploadRes = await fetch("/api/rps/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error ?? "Gagal upload");
      }
      const uploaded = await uploadRes.json();
      fileUrl = uploaded.url;
      fileType = uploaded.fileType;
      fileSize = uploaded.fileSize;
      fileName = uploaded.fileName;
      setIsUploading(false);

      setIsSaving(true);
      const title = `RPS - ${courseName}`;
      const saveRes = await fetch("/api/rps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          courseName,
          courseCode: courseCode || undefined,
          credits,
          semester,
          semesterType,
          academicYear,
          prerequisite: prerequisite || undefined,
          topic: topic || undefined,
          subTopic: subTopic || undefined,
          program: "Teknik Sipil",
          fileUrl,
          fileName,
          fileType,
          fileSize,
          isPublished,
          groupIds: selectedGroupIds,
        }),
      });

      if (!saveRes.ok) throw new Error("Gagal menyimpan");
      const data = await saveRes.json();
      toast.success("RPS berhasil disimpan");
      router.push(`/rps/${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsUploading(false);
      setIsSaving(false);
    }
  };

  const isLoading = isUploading || isSaving;

  return (
    <>
      <Header title="Upload RPS" />
      <div className="p-6 max-w-4xl space-y-4">

        {/* Step 1 — Bidang Ilmu */}
        <div className="glass-card rounded-2xl p-5">
          <StepHeader
            number={1}
            title="Bidang Ilmu"
            description="Kategorisasi membantu pencarian dan rekomendasi konten yang relevan untuk dosen lain."
            icon={<GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />}
            badge={
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Opsional
              </span>
            }
          />
          <StepDescription>Kategorisasi membantu pencarian dan rekomendasi konten yang relevan untuk dosen lain.</StepDescription>
          <TopicSelector
            topic={topic}
            subTopic={subTopic}
            onTopicChange={(v) => { setTopic(v); setSubTopic(""); }}
            onSubTopicChange={setSubTopic}
          />
        </div>

        {/* Step 2 — Identitas Mata Kuliah */}
        <div className="glass-card rounded-2xl p-5">
          <StepHeader
            number={2}
            title="Identitas Mata Kuliah"
            description="Informasi dasar mata kuliah yang akan ditampilkan pada halaman detail RPS."
            icon={<ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />}
          />
          <StepDescription>Informasi dasar mata kuliah yang akan ditampilkan pada halaman detail RPS.</StepDescription>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="courseName">
                Nama Mata Kuliah <span className="text-destructive">*</span>
              </Label>
              <Input
                id="courseName"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="contoh: Mekanika Tanah, Beton Bertulang"
                className="rounded-xl"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseCode">Kode Mata Kuliah</Label>
              <Input
                id="courseCode"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="contoh: SIP301"
                className="rounded-xl"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credits">Jumlah SKS</Label>
              <Select value={String(credits)} onValueChange={(v) => v && setCredits(Number(v))} disabled={isLoading}>
                <SelectTrigger id="credits" className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((c) => (
                    <SelectItem key={c} value={String(c)}>{c} SKS</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Penyelenggaraan — semester ke-, jenis, tahun dalam satu baris */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Penyelenggaraan</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select value={String(semester)} onValueChange={(v) => v && setSemester(Number(v))} disabled={isLoading}>
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={semesterType} onValueChange={(v) => v && setSemesterType(v as "Ganjil" | "Genap")} disabled={isLoading}>
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ganjil">Ganjil</SelectItem>
                    <SelectItem value="Genap">Genap</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={academicYear} onValueChange={(v) => v && setAcademicYear(v)} disabled={isLoading}>
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACADEMIC_YEARS.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">Semester ke- · Jenis semester · Tahun akademik</p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="prerequisite">Prasyarat</Label>
              <Input
                id="prerequisite"
                value={prerequisite}
                onChange={(e) => setPrerequisite(e.target.value)}
                placeholder="contoh: Mekanika Fluida (kosongkan jika tidak ada)"
                className="rounded-xl"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Step 3 — File RPS */}
        <div className="glass-card rounded-2xl p-5">
          <StepHeader
            number={3}
            title="File RPS"
            description="Unggah dokumen RPS dalam format PDF, Word, atau Excel. Ukuran maksimal 20MB."
            icon={<BookOpen className="h-3.5 w-3.5 text-muted-foreground" />}
            badge={
              <span className="text-destructive text-sm font-semibold">*</span>
            }
          />
          <StepDescription>Unggah dokumen RPS dalam format PDF, Word, atau Excel. Ukuran maksimal 20MB.</StepDescription>

          <div className="space-y-3">
            {/* Format badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {FILE_FORMAT_BADGES.map((b) => (
                <span
                  key={b.label}
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${b.className}`}
                >
                  {b.label}
                </span>
              ))}
              <span className="text-xs text-muted-foreground ml-1">· Maks. 20MB</span>
            </div>

            {/* Drop zone */}
            {!selectedFile ? (
              <div
                role="button"
                tabIndex={0}
                aria-label="Pilih file RPS untuk diunggah"
                className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  isDragging
                    ? "border-primary bg-primary/8 scale-[1.01]"
                    : "border-border hover:border-primary/60 hover:bg-accent/20"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
              >
                <div className="flex flex-col items-center justify-center gap-4 py-12 px-6">
                  <div className={`flex items-center justify-center h-16 w-16 rounded-2xl transition-colors ${isDragging ? "bg-primary/20" : "bg-primary/10"}`}>
                    <CloudUpload className={`h-8 w-8 transition-colors ${isDragging ? "text-primary" : "text-primary/70"}`} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold">
                      {isDragging ? "Lepaskan file di sini" : "Seret file ke sini atau klik untuk memilih"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, Word (.doc/.docx), Excel (.xls/.xlsx)
                    </p>
                  </div>
                  {!isDragging && (
                    <Button type="button" variant="outline" size="sm" className="rounded-lg pointer-events-none">
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Pilih File
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>
            ) : (
              /* File selected — rich preview */
              <div className="rounded-xl border bg-muted/20 overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-xl bg-background border">
                    {fileIcon(getFileExt(selectedFile.name), "lg")}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-semibold truncate leading-tight">{selectedFile.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {fileTypeBadge(getFileExt(selectedFile.name))}
                      <span className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div className="border-t px-4 py-2.5 bg-muted/30 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">File siap diunggah</p>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:pointer-events-none cursor-pointer"
                    aria-label="Ganti file"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Ganti file
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 4 — Visibilitas & Kelas */}
        <div className="glass-card rounded-2xl p-5">
          <StepHeader
            number={4}
            title="Visibilitas & Kelas"
            description="Atur siapa yang dapat mengakses RPS ini — publik untuk semua dosen, atau khusus kelas tertentu."
            icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />}
          />
          <StepDescription>Atur siapa yang dapat mengakses RPS ini — publik untuk semua dosen, atau khusus kelas tertentu.</StepDescription>
          <VisibilitySelector
            isPublished={isPublished}
            selectedGroupIds={selectedGroupIds}
            onPublishChange={setIsPublished}
            onGroupsChange={setSelectedGroupIds}
          />
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`w-full relative overflow-hidden rounded-xl h-14 text-sm font-semibold transition-all flex items-center justify-center gap-2.5 shadow-md
            ${isLoading
              ? "bg-primary/70 text-primary-foreground cursor-not-allowed"
              : "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground hover:shadow-lg active:scale-[0.99] cursor-pointer"
            }`}
          aria-label={isUploading ? "Sedang mengunggah file" : isSaving ? "Sedang menyimpan RPS" : "Simpan RPS"}
        >
          {/* shimmer overlay saat idle */}
          {!isLoading && (
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
          )}
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>Mengunggah ke Cloudinary... (1/2)</span>
            </>
          ) : isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>Menyimpan RPS... (2/2)</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4 shrink-0" />
              <span>Simpan RPS</span>
            </>
          )}
        </button>

      </div>
    </>
  );
}
