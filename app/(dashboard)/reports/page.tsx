"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  Users,
  ClipboardList,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Target,
  Award,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Eye,
  X,
  Filter,
  BookOpen,
  Layers,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportData {
  overview: {
    totalAttempts: number;
    uniqueStudents: number;
    uniqueQuizzes: number;
    avgScore: number;
    passRate: number;
  };
  quizStats: Array<{
    quizId: string;
    title: string;
    topic: string;
    subTopic: string;
    difficulty: string;
    questionCount: number;
    questionType: string;
    attemptCount: number;
    uniqueStudents: number;
    avgScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
  }>;
  studentStats: Array<{
    userId: string;
    name: string;
    nim: string | null;
    email: string;
    attemptCount: number;
    avgScore: number;
    passRate: number;
    lastAttempt: string | null;
  }>;
  distribution: number[];
  topicStats: Array<{
    topic: string;
    attemptCount: number;
    avgScore: number;
  }>;
}

interface Group {
  id: string;
  name: string;
  code: string;
}

interface StudentAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  topic: string;
  subTopic: string;
  difficulty: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  completedAt: string | null;
}

interface StudentDetail {
  user: { id: string; name: string; email: string; nim: string | null };
  attempts: StudentAttempt[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIST_LABELS = ["0–20", "21–40", "41–60", "61–80", "81–100"];
const DIST_COLORS = ["bg-red-500", "bg-orange-400", "bg-amber-400", "bg-blue-500", "bg-emerald-500"];
const DIST_TEXT = ["text-red-600", "text-orange-600", "text-amber-600", "text-blue-600", "text-emerald-600"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function scoreVariant(score: number): { bg: string; text: string; ring: string } {
  if (score >= 80) return { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-800" };
  if (score >= 60) return { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400", ring: "ring-blue-200 dark:ring-blue-800" };
  if (score >= 40) return { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", ring: "ring-amber-200 dark:ring-amber-800" };
  return { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", ring: "ring-red-200 dark:ring-red-800" };
}

function ScoreBadge({ score }: { score: number }) {
  const v = scoreVariant(score);
  return (
    <span className={`inline-flex items-center justify-center min-w-[52px] px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${v.bg} ${v.text} ${v.ring}`}>
      {score}%
    </span>
  );
}

function ScoreBar({ score, className = "" }: { score: number; className?: string }) {
  const v = scoreVariant(score);
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-blue-500" : score >= 40 ? "bg-amber-400" : "bg-red-500"}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-bold w-8 text-right ${v.text}`}>{score}%</span>
    </div>
  );
}

function StatusBadge({ passed }: { passed: boolean }) {
  return passed ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800">
      <CheckCircle2 className="h-3 w-3" />
      Lulus
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800">
      <AlertCircle className="h-3 w-3" />
      Perhatian
    </span>
  );
}

function difficultyLabel(d: string) {
  const map: Record<string, string> = { beginner: "Dasar", intermediate: "Menengah", advanced: "Lanjut" };
  return map[d] || d;
}

// ─── Export ───────────────────────────────────────────────────────────────────

async function triggerExport(
  format: "pdf" | "docx",
  scope: "all" | "group" | "student",
  extra?: { groupId?: string; studentId?: string }
) {
  const res = await fetch("/api/export/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format, scope, ...extra }),
  });
  if (!res.ok) { alert("Gagal mengekspor laporan."); return; }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const scopeLabel = scope === "group" ? "kelas" : scope === "student" ? "mahasiswa" : "semua";
  a.download = `laporan-nilai-${scopeLabel}.${format === "pdf" ? "pdf" : "docx"}`;
  a.click();
  URL.revokeObjectURL(url);
}

function ExportDropdown({
  label,
  scope,
  extra,
  disabled,
  variant = "default",
}: {
  label: string;
  scope: "all" | "group" | "student";
  extra?: { groupId?: string; studentId?: string };
  disabled?: boolean;
  variant?: "default" | "primary";
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"pdf" | "docx" | null>(null);

  const handle = async (format: "pdf" | "docx") => {
    setOpen(false);
    setLoading(format);
    await triggerExport(format, scope, extra);
    setLoading(null);
  };

  const base =
    variant === "primary"
      ? "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      : "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border bg-background hover:bg-accent transition-colors disabled:opacity-50";

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} disabled={disabled || loading !== null} className={base}>
        <Download className="h-3.5 w-3.5" />
        {loading ? "Mengekspor..." : label}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 w-40 rounded-xl border bg-background shadow-xl py-1.5">
            <button
              onClick={() => handle("pdf")}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <div className="h-6 w-6 rounded-md bg-red-50 flex items-center justify-center">
                <FileText className="h-3.5 w-3.5 text-red-500" />
              </div>
              Ekspor PDF
            </button>
            <button
              onClick={() => handle("docx")}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <div className="h-6 w-6 rounded-md bg-blue-50 flex items-center justify-center">
                <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" />
              </div>
              Ekspor Word
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Student Detail Modal ─────────────────────────────────────────────────────

function StudentDetailModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports/student/${studentId}`)
      .then((r) => r.json())
      .then((d) => setDetail(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId]);

  const avgPct = detail
    ? Math.round((detail.attempts.reduce((s, a) => s + a.percentage, 0) / detail.attempts.length) * 10) / 10
    : 0;
  const passedCount = detail ? detail.attempts.filter((a) => a.passed).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-2xl border bg-background shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-4 p-5 border-b">
          {!loading && detail && (
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">{initials(detail.user.name)}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold truncate">
              {loading ? "Memuat data..." : detail?.user.name ?? "Detail Mahasiswa"}
            </h2>
            {detail && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {detail.user.nim ? <><span className="font-mono">{detail.user.nim}</span> · </> : ""}
                {detail.user.email}
              </p>
            )}
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-accent transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : !detail || detail.attempts.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Mahasiswa belum mengerjakan kuis apapun.</p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border bg-muted/20 p-4 text-center">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Percobaan</p>
                  <p className="text-2xl font-bold">{detail.attempts.length}</p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-4 text-center">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Rata-rata</p>
                  <ScoreBadge score={avgPct} />
                </div>
                <div className="rounded-xl border bg-muted/20 p-4 text-center">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Lulus</p>
                  <p className={`text-2xl font-bold ${passedCount === detail.attempts.length ? "text-emerald-600" : passedCount === 0 ? "text-red-600" : "text-amber-600"}`}>
                    {passedCount}/{detail.attempts.length}
                  </p>
                </div>
              </div>

              {/* Attempt table */}
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">#</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Kuis</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Sub-topik</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Skor</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {detail.attempts.map((a, i) => (
                      <tr key={a.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{i + 1}</td>
                        <td className="px-4 py-3">
                          <Link href={`/quizzes/${a.quizId}`} className="text-sm font-medium hover:text-primary transition-colors line-clamp-1">
                            {a.quizTitle}
                          </Link>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">{a.subTopic}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <ScoreBadge score={a.percentage} />
                            <span className="text-[10px] text-muted-foreground">{a.score}/{a.totalPoints} poin</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge passed={a.passed} />
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                          {a.completedAt ? formatDate(a.completedAt) : "–"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {detail ? `${detail.attempts.length} percobaan tercatat` : ""}
          </span>
          <div className="flex gap-2">
            {detail && (
              <ExportDropdown label="Ekspor" scope="student" extra={{ studentId }} />
            )}
            <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-lg border hover:bg-accent transition-colors font-medium">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Loading ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <>
      <Header title="Laporan & Evaluasi" description="Analisis performa kuis mahasiswa" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 h-24 animate-pulse bg-muted/30" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl h-48 animate-pulse bg-muted/30" />
          <div className="lg:col-span-2 glass-card rounded-2xl h-48 animate-pulse bg-muted/30" />
        </div>
        <div className="glass-card rounded-2xl h-64 animate-pulse bg-muted/30" />
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"quiz" | "student" | "topic">("quiz");
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);

  const fetchData = useCallback(async (groupId?: string) => {
    setLoading(true);
    try {
      const url = groupId ? `/api/reports?groupId=${groupId}` : "/api/reports";
      const res = await fetch(url);
      if (res.ok) setData(await res.json());
    } catch { /* silently fail */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetch("/api/groups").then((r) => r.json()).then((d) => setGroups(Array.isArray(d) ? d : [])).catch(() => {});
  }, [fetchData]);

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    fetchData(groupId || undefined);
  };

  if (loading) return <LoadingSkeleton />;

  if (!data || data.overview.totalAttempts === 0) {
    return (
      <>
        <Header title="Laporan & Evaluasi" description="Analisis performa kuis mahasiswa" />
        <div className="p-6">
          <div className="glass-card rounded-2xl p-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Belum Ada Data Laporan</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Laporan muncul setelah mahasiswa mengerjakan kuis. Pastikan kuis sudah dipublish dan mahasiswa sudah bergabung di kelas.
            </p>
          </div>
        </div>
      </>
    );
  }

  const { overview, quizStats, studentStats, distribution, topicStats } = data;
  const maxDist = Math.max(...distribution, 1);

  const OVERVIEW_CARDS = [
    { label: "Total Percobaan", value: overview.totalAttempts, icon: ClipboardList, color: "text-violet-600", bg: "bg-violet-500/10" },
    { label: "Mahasiswa Aktif", value: overview.uniqueStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-500/10" },
    { label: "Kuis Dikerjakan", value: overview.uniqueQuizzes, icon: Target, color: "text-indigo-600", bg: "bg-indigo-500/10" },
    { label: "Rata-rata Skor", value: `${overview.avgScore}%`, icon: TrendingUp, color: scoreVariant(overview.avgScore).text, bg: scoreVariant(overview.avgScore).bg + " ring-0" },
    { label: "Tingkat Lulus", value: `${overview.passRate}%`, icon: Award, color: scoreVariant(overview.passRate).text, bg: scoreVariant(overview.passRate).bg + " ring-0" },
  ];

  return (
    <>
      {detailStudentId && (
        <StudentDetailModal studentId={detailStudentId} onClose={() => setDetailStudentId(null)} />
      )}
      <Header title="Laporan & Evaluasi" description="Analisis performa kuis mahasiswa" />

      <div className="p-6 space-y-6">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter:</span>
            <select
              value={selectedGroupId}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="text-sm rounded-lg border bg-muted/40 px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
            >
              <option value="">Semua Mahasiswa</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.code})</option>
              ))}
            </select>
          </div>
          <ExportDropdown
            label={selectedGroupId ? "Ekspor Kelas Ini" : "Ekspor Semua"}
            scope={selectedGroupId ? "group" : "all"}
            extra={selectedGroupId ? { groupId: selectedGroupId } : undefined}
            variant="primary"
          />
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {OVERVIEW_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="glass-card rounded-2xl p-4">
              <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`h-4.5 w-4.5 ${color}`} />
              </div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${typeof value === "string" ? color : ""}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Score Distribution */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Distribusi Skor
            </h3>
            <div className="space-y-2.5">
              {distribution.map((count, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`text-[11px] font-semibold w-13 shrink-0 ${DIST_TEXT[i]}`}>
                    {DIST_LABELS[i]}
                  </span>
                  <div className="flex-1 h-7 bg-muted/40 rounded-lg overflow-hidden relative">
                    <div
                      className={`h-full ${DIST_COLORS[i]} rounded-lg flex items-center justify-end px-2.5 transition-all duration-500`}
                      style={{ width: `${Math.max((count / maxDist) * 100, count > 0 ? 15 : 0)}%` }}
                    >
                      {count > 0 && <span className="text-[11px] font-bold text-white">{count}</span>}
                    </div>
                    {count === 0 && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/50">
                        0
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-muted-foreground ml-1">= Lulus (≥ 60%)</span>
            </div>
          </div>

          {/* Topic Performance */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Performa per Bidang
            </h3>
            {topicStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/50">
                <Layers className="h-8 w-8 mb-2" />
                <p className="text-sm">Belum ada data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topicStats
                  .sort((a, b) => b.attemptCount - a.attemptCount)
                  .map((t) => (
                    <div key={t.topic} className="flex items-center gap-3">
                      <p className="text-xs font-medium w-36 shrink-0 truncate">{t.topic}</p>
                      <div className="flex-1">
                        <ScoreBar score={t.avgScore} />
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0 font-normal">
                        {t.attemptCount}×
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab section */}
        <div className="space-y-4">
          {/* Tab nav */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
              {[
                { key: "quiz" as const, label: "Per Kuis", count: quizStats.length },
                { key: "student" as const, label: "Per Mahasiswa", count: studentStats.length },
                { key: "topic" as const, label: "Per Bidang", count: topicStats.length },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === t.key
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-semibold ${
                    tab === t.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quiz Stats Tab */}
          {tab === "quiz" && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30 sticky top-0">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-8">#</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Judul Kuis</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Sub-topik</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Tingkat</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Percobaan</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide min-w-[140px]">Rata-rata</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Tertinggi</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Terendah</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">% Lulus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {quizStats
                      .sort((a, b) => b.attemptCount - a.attemptCount)
                      .map((q, i) => (
                        <tr key={q.quizId} className="hover:bg-accent/30 transition-colors">
                          <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">{i + 1}</td>
                          <td className="px-4 py-3.5">
                            <Link href={`/quizzes/${q.quizId}`} className="text-sm font-medium hover:text-primary transition-colors line-clamp-1 max-w-[200px] block">
                              {q.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[160px]">
                            <span className="line-clamp-1">{q.subTopic}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <Badge variant="outline" className="rounded-full text-[11px] font-medium">
                              {difficultyLabel(q.difficulty)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="text-sm font-semibold">{q.attemptCount}</span>
                            <span className="text-[10px] text-muted-foreground block">{q.uniqueStudents} siswa</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <ScoreBar score={q.avgScore} />
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <ScoreBadge score={q.highestScore} />
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <ScoreBadge score={q.lowestScore} />
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <ScoreBadge score={q.passRate} />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {quizStats.length === 0 && (
                <div className="py-12 text-center text-muted-foreground/60">
                  <BookOpen className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Belum ada data kuis</p>
                </div>
              )}
            </div>
          )}

          {/* Student Stats Tab */}
          {tab === "student" && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30 sticky top-0">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-8">#</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Mahasiswa</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">NIM</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Percobaan</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide min-w-[140px]">Rata-rata</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">% Lulus</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Terakhir</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {studentStats
                      .sort((a, b) => b.avgScore - a.avgScore)
                      .map((s, i) => (
                        <tr key={s.userId} className="hover:bg-accent/30 transition-colors">
                          <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">{i + 1}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-primary">{initials(s.name)}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium leading-tight">{s.name}</p>
                                <p className="text-[11px] text-muted-foreground">{s.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-xs font-mono text-muted-foreground">{s.nim ?? "–"}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="text-sm font-semibold">{s.attemptCount}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <ScoreBar score={s.avgScore} />
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <ScoreBadge score={s.passRate} />
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <StatusBadge passed={s.avgScore >= 60} />
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-xs text-muted-foreground">
                              {s.lastAttempt ? formatDate(s.lastAttempt) : "–"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => setDetailStudentId(s.userId)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/8 text-primary hover:bg-primary/15 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {studentStats.length === 0 && (
                <div className="py-12 text-center text-muted-foreground/60">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Belum ada data mahasiswa</p>
                </div>
              )}
            </div>
          )}

          {/* Topic Detail Tab */}
          {tab === "topic" && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">#</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Bidang Ilmu</th>
                    <th className="px-5 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Percobaan</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide min-w-[200px]">Rata-rata Skor</th>
                    <th className="px-5 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {topicStats
                    .sort((a, b) => b.attemptCount - a.attemptCount)
                    .map((t, i) => (
                      <tr key={t.topic} className="hover:bg-accent/30 transition-colors">
                        <td className="px-5 py-4 text-xs text-muted-foreground font-mono">{i + 1}</td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold">{t.topic}</p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold">{t.attemptCount}</span>
                          <span className="text-[10px] text-muted-foreground block">percobaan</span>
                        </td>
                        <td className="px-5 py-4">
                          <ScoreBar score={t.avgScore} />
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusBadge passed={t.avgScore >= 60} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {topicStats.length === 0 && (
                <div className="py-12 text-center text-muted-foreground/60">
                  <Layers className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Belum ada data per bidang</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
