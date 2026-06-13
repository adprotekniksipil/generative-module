"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ClipboardList,
  Calendar,
  CheckCircle2,
  Hash,
  Award,
  Save,
  Users,
  PenLine,
  Bot,
  ShieldAlert,
  LockOpen,
  SlidersHorizontal,
  ClipboardCheck,
} from "lucide-react";
import { VisibilitySelector } from "@/components/visibility/visibility-selector";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { toast } from "sonner";
import { useTopics } from "@/contexts/topics-context";
import type { QuizQuestion } from "@/lib/types";

interface QuizDetail {
  id: string;
  title: string;
  topic: string;
  subTopic: string;
  difficulty: string;
  questionCount: number;
  questionType: string;
  questions: QuizQuestion[];
  totalPoints: number;
  isPublished: boolean;
  essayGradingMode: "manual" | "ai_auto";
  createdAt: string;
  groups?: { groupId: string }[];
}

interface EssayGrade {
  score: number;
  maxScore: number;
  feedback: string;
  gradedBy: "manual" | "ai";
}

interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: string;
  score: number;
  totalPoints: number;
  essayGrades: string | null;
  completedAt: string | null;
  lockedAt: string | null;
  violationCount: number;
  user: { id: string; name: string; email: string };
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

const typeLabel: Record<string, string> = {
  multiple_choice: "Pilihan Ganda",
  essay: "Esai",
  true_false: "Benar/Salah",
};

export default function QuizDetailPage() {
  const { getTopicLabel, getSubTopicLabel } = useTopics();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showAnswers, setShowAnswers] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [isPublished, setIsPublished] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [essayGradingMode, setEssayGradingMode] = useState<"manual" | "ai_auto">("manual");
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);

  // Attempts & grading
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [gradingState, setGradingState] = useState<Record<number, { score: string; feedback: string }>>({});
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [isAiGrading, setIsAiGrading] = useState(false);

  useEffect(() => {
    fetch(`/api/quizzes/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setQuiz(data);
        setIsPublished(data.isPublished ?? false);
        setSelectedGroupIds(data.groups?.map((g: { groupId: string }) => g.groupId) ?? []);
        setEssayGradingMode(data.essayGradingMode ?? "manual");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const hasEssayQuestions = quiz?.questions.some((q) => q.type === "essay") ?? false;

  const fetchAttempts = async () => {
    setLoadingAttempts(true);
    try {
      const res = await fetch(`/api/quizzes/${id}/attempts`);
      const data = await res.json();
      setAttempts(data);
    } catch {
      toast.error("Gagal memuat data percobaan");
    } finally {
      setLoadingAttempts(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Hapus soal ini?")) return;
    try {
      await fetch(`/api/quizzes/${id}`, { method: "DELETE" });
      toast.success("Soal berhasil dihapus");
      router.push("/quizzes");
    } catch {
      toast.error("Gagal menghapus soal");
    }
  };

  const handleExport = async (format: "pdf" | "docx") => {
    if (!quiz) return;
    setIsExporting(true);
    try {
      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "quiz",
          title: quiz.title,
          questions: quiz.questions,
          showAnswers,
        }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quiz.title}${showAnswers ? " (+ Kunci)" : ""}.${format === "pdf" ? "pdf" : "docx"}`;
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
    if (!quiz) return;
    setIsExporting(true);
    try {
      const res = await fetch("/api/export/mbz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "quiz", id: quiz.id }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${quiz.title}.mbz`; a.click();
      URL.revokeObjectURL(url);
      toast.success("MBZ berhasil didownload");
    } catch {
      toast.error("Gagal export MBZ");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleQuestion = (num: number) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const expandAll = () => {
    if (!quiz) return;
    if (expandedQuestions.size === quiz.questions.length) {
      setExpandedQuestions(new Set());
    } else {
      setExpandedQuestions(new Set(quiz.questions.map((q) => q.number)));
    }
  };

  // Track if settings have unsaved changes
  const hasSettingsChanged = quiz
    ? isPublished !== quiz.isPublished ||
      essayGradingMode !== (quiz.essayGradingMode ?? "manual") ||
      JSON.stringify(selectedGroupIds.sort()) !== JSON.stringify((quiz.groups?.map(g => g.groupId) ?? []).sort())
    : false;

  const handleSaveSettings = async () => {
    if (!quiz) return;
    setIsSavingVisibility(true);
    try {
      const res = await fetch(`/api/quizzes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished, groupIds: selectedGroupIds, essayGradingMode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal menyimpan");
      }
      const updated = await res.json();
      setQuiz({ ...quiz, ...updated, questions: quiz.questions });
      toast.success(
        essayGradingMode === "ai_auto"
          ? "Pengaturan disimpan — Penilaian esai: AI Otomatis"
          : "Pengaturan disimpan — Penilaian esai: Manual"
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan pengaturan");
    } finally {
      setIsSavingVisibility(false);
    }
  };

  // Grading functions
  const selectAttemptForGrading = (attempt: QuizAttempt) => {
    setSelectedAttempt(attempt);
    const existingGrades: Record<number, EssayGrade> = attempt.essayGrades
      ? JSON.parse(attempt.essayGrades)
      : {};
    const state: Record<number, { score: string; feedback: string }> = {};
    if (quiz) {
      for (const q of quiz.questions) {
        if (q.type === "essay") {
          const existing = existingGrades[q.number];
          state[q.number] = {
            score: existing ? String(existing.score) : "",
            feedback: existing ? existing.feedback : "",
          };
        }
      }
    }
    setGradingState(state);
  };

  const handleSaveManualGrade = async () => {
    if (!selectedAttempt || !quiz) return;
    setIsSavingGrade(true);
    try {
      const essayGrades: Record<number, { score: number; maxScore: number; feedback: string }> = {};
      for (const q of quiz.questions) {
        if (q.type === "essay" && gradingState[q.number]) {
          const s = gradingState[q.number];
          const score = parseFloat(s.score) || 0;
          essayGrades[q.number] = {
            score: Math.min(Math.max(0, score), q.points),
            maxScore: q.points,
            feedback: s.feedback,
          };
        }
      }

      const res = await fetch(`/api/quizzes/${id}/attempts/${selectedAttempt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essayGrades }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || "Gagal menyimpan");
      }
      const updated = await res.json();

      setAttempts((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
      setSelectedAttempt(updated);
      toast.success("Penilaian berhasil disimpan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan penilaian");
    } finally {
      setIsSavingGrade(false);
    }
  };

  const handleUnlock = async (attempt: QuizAttempt) => {
    try {
      const res = await fetch(`/api/quizzes/${id}/attempts/${attempt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlock: true }),
      });
      if (!res.ok) throw new Error("Gagal");
      const updated = await res.json();
      setAttempts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      if (selectedAttempt?.id === updated.id) setSelectedAttempt(updated);
      toast.success(`Ujian ${attempt.user.name} telah dibuka kembali`);
    } catch {
      toast.error("Gagal membuka kunci ujian");
    }
  };

  const handleAiGrade = async () => {
    if (!selectedAttempt) return;
    setIsAiGrading(true);
    try {
      const res = await fetch(`/api/quizzes/${id}/attempts/${selectedAttempt.id}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Gagal");
      const updated = await res.json();

      setAttempts((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
      setSelectedAttempt(updated);

      // Update grading state with AI results
      const aiGrades: Record<number, EssayGrade> = updated.essayGrades
        ? JSON.parse(updated.essayGrades)
        : {};
      setGradingState((prev) => {
        const next = { ...prev };
        for (const [qNum, grade] of Object.entries(aiGrades)) {
          next[Number(qNum)] = {
            score: String(grade.score),
            feedback: grade.feedback,
          };
        }
        return next;
      });

      toast.success("Penilaian AI berhasil");
    } catch {
      toast.error("Gagal melakukan penilaian AI");
    } finally {
      setIsAiGrading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Soal" />
        <div className="p-6 space-y-4 max-w-4xl">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </>
    );
  }

  if (!quiz) {
    return (
      <>
        <Header title="Soal Tidak Ditemukan" />
        <div className="p-6">
          <div className="glass-card rounded-2xl p-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Soal tidak ditemukan.</p>
            <Button variant="outline" className="rounded-xl" onClick={() => router.push("/quizzes")}>
              Kembali ke daftar soal
            </Button>
          </div>
        </div>
      </>
    );
  }

  const allExpanded = expandedQuestions.size === quiz.questions.length;

  return (
    <>

      <Header title={quiz.title} />
      <div className="p-6 max-w-4xl space-y-5">
        {/* Action bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => router.push("/quizzes")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Daftar Soal
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setShowAnswers(!showAnswers)}>
              {showAnswers ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showAnswers ? "Sembunyikan" : "Tampilkan"} Kunci
            </Button>
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
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  Export PDF {showAnswers ? "(+ Kunci Jawaban)" : "(Soal Saja)"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("docx")}>
                  Export Word {showAnswers ? "(+ Kunci Jawaban)" : "(Soal Saja)"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportMbz()}>
                  Download MBZ (Moodle)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" className="rounded-xl gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              Hapus
            </Button>
          </div>
        </div>

        {/* Summary card */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <ClipboardList className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h2 className="font-semibold text-sm leading-snug">{quiz.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {getTopicLabel(quiz.topic)} · {getSubTopicLabel(quiz.topic, quiz.subTopic)}
                </p>
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
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${difficultyColors[quiz.difficulty] ?? "bg-muted text-muted-foreground border-border"}`}>
              {difficultyLabels[quiz.difficulty] ?? quiz.difficulty}
            </span>
            <Badge variant="secondary" className="rounded-lg text-xs">
              {typeLabel[quiz.questionType] ?? quiz.questionType}
            </Badge>
            {hasEssayQuestions && (
              <Badge variant="outline" className={`rounded-lg gap-1 text-xs ${
                essayGradingMode === "ai_auto"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}>
                {essayGradingMode === "ai_auto" ? (
                  <><Bot className="h-3 w-3" /> AI Grading</>
                ) : (
                  <><PenLine className="h-3 w-3" /> Manual Grading</>
                )}
              </Badge>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 pt-1 border-t border-border/50 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              {quiz.questionCount} soal
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Award className="h-3.5 w-3.5" />
              {quiz.totalPoints} poin total
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(quiz.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Main content tabs */}
        <Tabs defaultValue="questions" onValueChange={(v) => {
          if (v === "grading" && attempts.length === 0) fetchAttempts();
        }}>
          <TabsList className="rounded-xl">
            <TabsTrigger value="questions" className="rounded-lg gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              Soal
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Pengaturan
            </TabsTrigger>
            <TabsTrigger value="grading" className="rounded-lg gap-1.5">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Hasil & Penilaian
              {hasEssayQuestions && (
                <span className="ml-1 h-2 w-2 rounded-full bg-amber-400" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-3 mt-4">
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1" onClick={expandAll}>
                {allExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {allExpanded ? "Tutup Semua" : "Buka Semua"}
              </Button>
            </div>

            {quiz.questions.map((q) => {
              const isExpanded = expandedQuestions.has(q.number);
              return (
                <div key={q.number} className="glass-card rounded-2xl overflow-hidden transition-shadow hover:shadow-soft-lg">
                  <div className="p-5 cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => toggleQuestion(q.number)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                          <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                            {q.number}
                          </span>
                          <Badge variant="secondary" className="rounded-lg text-[11px]">
                            {typeLabel[q.type] ?? q.type}
                          </Badge>
                          {q.type === "essay" && (
                            <Badge variant="outline" className={`rounded-lg text-[10px] gap-0.5 ${
                              essayGradingMode === "ai_auto"
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}>
                              {essayGradingMode === "ai_auto" ? (
                                <><Bot className="h-3 w-3" /> AI Grading</>
                              ) : (
                                <><PenLine className="h-3 w-3" /> Manual Grading</>
                              )}
                            </Badge>
                          )}
                          {q.bloomLevel && (
                            <Badge variant="outline" className="rounded-lg text-[11px]">
                              {q.bloomLevel}
                            </Badge>
                          )}
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {q.points} poin
                          </span>
                        </div>
                        <div className="text-sm leading-relaxed [&_.markdown-body]:my-0 [&_.markdown-body_p]:my-0 [&_.markdown-body_p]:leading-relaxed">
                          <MarkdownRenderer content={q.question} />
                        </div>
                      </div>
                      <div className="pt-1">
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-3">
                      {q.options && q.options.length > 0 && (
                        <div className="space-y-1.5">
                          {q.options.map((opt, i) => {
                            const isCorrect = showAnswers && opt.startsWith(q.correctAnswer);
                            return (
                              <div
                                key={i}
                                className={`text-sm px-4 py-3 rounded-xl flex items-start gap-2.5 transition-colors ${
                                  isCorrect
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-muted/40 border border-transparent"
                                }`}
                              >
                                {isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />}
                                <div className="[&_.markdown-body]:my-0 [&_.markdown-body_p]:my-0 flex-1 min-w-0">
                                  <MarkdownRenderer content={opt} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {showAnswers && (
                        <div className="border-t border-border/50 pt-4 mt-3 space-y-3">
                          <div className="flex items-start gap-2">
                            <div className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <CheckCircle2 className="h-3 w-3 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Jawaban Benar</p>
                              <div className="text-sm font-medium [&_.markdown-body]:my-0 [&_.markdown-body_p]:my-0">
                                <MarkdownRenderer content={q.correctAnswer} />
                              </div>
                            </div>
                          </div>
                          <div className="bg-muted/30 rounded-xl p-4">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Pembahasan</p>
                            <div className="text-sm text-muted-foreground leading-relaxed [&_.markdown-body_p]:my-1 [&_.markdown-body_p]:leading-relaxed">
                              <MarkdownRenderer content={q.explanation} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4 space-y-4">
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold">Visibilitas & Kelas</h3>
              <VisibilitySelector
                isPublished={isPublished}
                selectedGroupIds={selectedGroupIds}
                onPublishChange={setIsPublished}
                onGroupsChange={setSelectedGroupIds}
              />
            </div>

            {/* Essay Grading Mode */}
            {hasEssayQuestions && (
              <div className="glass-card rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold">Mode Penilaian Esai</h3>
                <p className="text-xs text-muted-foreground">
                  Pilih bagaimana soal esai dinilai saat mahasiswa mengirim jawaban.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`text-left rounded-xl p-4 border-2 transition-all ${
                      essayGradingMode === "manual"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                    onClick={() => setEssayGradingMode("manual")}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <PenLine className={`h-4 w-4 ${essayGradingMode === "manual" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-semibold">Manual</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Dosen menilai jawaban esai secara manual satu per satu. Bisa juga menggunakan AI sebagai asisten.
                    </p>
                  </button>
                  <button
                    type="button"
                    className={`text-left rounded-xl p-4 border-2 transition-all ${
                      essayGradingMode === "ai_auto"
                        ? "border-blue-500 bg-blue-50/50"
                        : "border-border hover:border-blue-300"
                    }`}
                    onClick={() => setEssayGradingMode("ai_auto")}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Bot className={`h-4 w-4 ${essayGradingMode === "ai_auto" ? "text-blue-600" : "text-muted-foreground"}`} />
                      <span className="text-sm font-semibold">AI Otomatis</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      AI menilai jawaban esai otomatis saat mahasiswa submit. Dosen tetap bisa override skor.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Sticky save bar for settings */}
            {hasSettingsChanged && (
              <div className="sticky bottom-4 z-10">
                <div className="glass-card rounded-xl px-4 py-3 flex items-center justify-between shadow-lg border border-primary/20 bg-primary/5">
                  <p className="text-xs font-medium text-primary">
                    Ada perubahan pengaturan yang belum disimpan
                  </p>
                  <Button size="sm" className="rounded-xl gap-1.5" onClick={handleSaveSettings} disabled={isSavingVisibility}>
                    {isSavingVisibility ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Simpan Pengaturan
                  </Button>
                </div>
              </div>
            )}
            {!hasSettingsChanged && (
              <div className="flex justify-end">
                <Button size="sm" variant="outline" className="rounded-xl gap-1.5" disabled>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Tersimpan
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Grading Tab */}
          <TabsContent value="grading" className="mt-4 space-y-4">
            {loadingAttempts ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Memuat data percobaan...</p>
              </div>
            ) : attempts.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Belum ada mahasiswa yang mengerjakan kuis ini.</p>
              </div>
            ) : (
              <>
                {/* Grading summary bar */}
                {hasEssayQuestions && (() => {
                  const essayCount = quiz.questions.filter((q) => q.type === "essay").length;
                  const totalNeedGrading = attempts.filter((a) => {
                    const grades = a.essayGrades ? JSON.parse(a.essayGrades) : {};
                    return Object.keys(grades).length < essayCount;
                  }).length;
                  const allGraded = totalNeedGrading === 0;
                  return (
                    <div className={`rounded-xl p-3 flex items-center gap-3 text-sm ${
                      allGraded
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                        : "bg-amber-50 border border-amber-200 text-amber-800"
                    }`}>
                      {allGraded ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <PenLine className="h-4 w-4 text-amber-600 shrink-0" />
                      )}
                      <span className="font-medium">
                        {allGraded
                          ? "Semua jawaban esai sudah dinilai"
                          : `${totalNeedGrading} dari ${attempts.length} percobaan belum dinilai esainya`}
                      </span>
                      {!allGraded && (
                        <span className="text-xs ml-auto opacity-70">
                          {essayCount} soal esai per percobaan
                        </span>
                      )}
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Attempt list */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    Daftar Percobaan ({attempts.length})
                  </h4>
                  <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
                    {attempts.map((attempt) => {
                      const grades: Record<number, EssayGrade> = attempt.essayGrades
                        ? JSON.parse(attempt.essayGrades)
                        : {};
                      const essayCount = quiz.questions.filter((q) => q.type === "essay").length;
                      const gradedCount = Object.keys(grades).length;
                      const needsGrading = essayCount > 0 && gradedCount < essayCount;
                      const isSelected = selectedAttempt?.id === attempt.id;
                      const isLocked = !!attempt.lockedAt && !attempt.completedAt;
                      const isUnlocked = !attempt.lockedAt && !attempt.completedAt;

                      return (
                        <div
                          key={attempt.id}
                          className={`rounded-xl transition-colors ${
                            isLocked
                              ? "border-2 border-rose-300 bg-rose-50/50"
                              : isUnlocked
                              ? "border-2 border-amber-200 bg-amber-50/40"
                              : isSelected
                              ? "bg-primary/10 border border-primary/20"
                              : "glass-card hover:bg-accent/50"
                          }`}
                        >
                          <button
                            type="button"
                            className="w-full text-left p-3"
                            onClick={() => !isLocked && !isUnlocked && selectAttemptForGrading(attempt)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium truncate">{attempt.user.name}</p>
                              {isLocked ? (
                                <Badge className="rounded-md text-[9px] px-1.5 py-0 bg-rose-100 text-rose-700 border border-rose-300 gap-1 shrink-0">
                                  <ShieldAlert className="h-2.5 w-2.5" /> Terkunci
                                </Badge>
                              ) : isUnlocked ? (
                                <Badge className="rounded-md text-[9px] px-1.5 py-0 bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                                  Sedang Dikerjakan
                                </Badge>
                              ) : (
                                <span className="text-xs font-bold text-primary shrink-0">
                                  {Math.round(attempt.score)}/{attempt.totalPoints}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {attempt.user.email}
                            </p>
                            {isLocked ? (
                              <p className="text-[10px] text-rose-600 mt-1 font-medium">
                                {attempt.violationCount}x pelanggaran &bull; Dikunci{" "}
                                {new Date(attempt.lockedAt!).toLocaleString("id-ID")}
                              </p>
                            ) : isUnlocked ? (
                              <p className="text-[10px] text-amber-600 mt-1 font-medium">
                                Ujian dibuka, menunggu mahasiswa menyelesaikan
                              </p>
                            ) : (
                              <div className="flex items-center gap-2 mt-1">
                                {needsGrading && (
                                  <Badge variant="outline" className="rounded-md text-[9px] px-1.5 py-0 border-amber-200 bg-amber-50 text-amber-700 shrink-0">
                                    {gradedCount}/{essayCount} dinilai
                                  </Badge>
                                )}
                                {essayCount > 0 && gradedCount === essayCount && (
                                  <Badge variant="outline" className="rounded-md text-[9px] px-1.5 py-0 border-emerald-200 bg-emerald-50 text-emerald-700 shrink-0">
                                    Selesai
                                  </Badge>
                                )}
                                <p className="text-[10px] text-muted-foreground">
                                  {attempt.completedAt ? new Date(attempt.completedAt).toLocaleString("id-ID") : "—"}
                                </p>
                              </div>
                            )}
                          </button>
                          {isLocked && (
                            <div className="px-3 pb-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full rounded-lg text-xs gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-100"
                                onClick={() => handleUnlock(attempt)}
                              >
                                <LockOpen className="h-3.5 w-3.5" /> Buka Kunci Ujian
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Grading panel */}
                <div className="lg:col-span-2">
                  {!selectedAttempt ? (
                    <div className="glass-card rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center">
                      <PenLine className="h-8 w-8 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Pilih percobaan dari daftar untuk mulai menilai
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Grading header */}
                      <div className="glass-card rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">{selectedAttempt.user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Skor saat ini: {Math.round(selectedAttempt.score)}/{selectedAttempt.totalPoints} poin
                            </p>
                          </div>
                          {hasEssayQuestions && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl gap-1.5 text-xs"
                                onClick={handleAiGrade}
                                disabled={isAiGrading}
                              >
                                {isAiGrading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Bot className="h-3.5 w-3.5" />
                                )}
                                Nilai dengan AI
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-xl gap-1.5 text-xs"
                                onClick={handleSaveManualGrade}
                                disabled={isSavingGrade}
                              >
                                {isSavingGrade ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                                Simpan Nilai
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Render each question with student answer */}
                      {quiz.questions.map((q) => {
                        const studentAnswers: Record<number, string> = JSON.parse(selectedAttempt.answers);
                        const studentAnswer = studentAnswers[q.number] ?? "";
                        const existingGrades: Record<number, EssayGrade> = selectedAttempt.essayGrades
                          ? JSON.parse(selectedAttempt.essayGrades)
                          : {};
                        const existingGrade = existingGrades[q.number];

                        if (q.type !== "essay") {
                          // Show auto-graded result
                          const isCorrect =
                            studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ||
                            studentAnswer.startsWith(q.correctAnswer);
                          return (
                            <div key={q.number} className="glass-card rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/10 text-primary text-xs font-bold">
                                  {q.number}
                                </span>
                                <Badge variant="secondary" className="rounded-md text-[10px]">
                                  {typeLabel[q.type] ?? q.type}
                                </Badge>
                                {isCorrect ? (
                                  <Badge className="rounded-md text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">
                                    Benar
                                  </Badge>
                                ) : studentAnswer ? (
                                  <Badge className="rounded-md text-[10px] bg-rose-100 text-rose-700 border-rose-200">
                                    Salah
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="rounded-md text-[10px]">
                                    Tidak dijawab
                                  </Badge>
                                )}
                                <span className="text-[10px] text-muted-foreground ml-auto">
                                  {isCorrect ? q.points : 0}/{q.points} poin
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{q.question}</p>
                            </div>
                          );
                        }

                        // Essay question — show grading UI
                        const currentScore = parseFloat(gradingState[q.number]?.score || "0") || 0;
                        const scorePercent = q.points > 0 ? (currentScore / q.points) * 100 : 0;
                        const scoreColor = scorePercent >= 70 ? "text-emerald-700" : scorePercent >= 40 ? "text-amber-700" : "text-rose-700";
                        const borderColor = existingGrade
                          ? existingGrade.gradedBy === "ai"
                            ? "border-l-blue-400"
                            : "border-l-emerald-400"
                          : essayGradingMode === "ai_auto"
                            ? "border-l-blue-300"
                            : "border-l-amber-300";
                        const numberBg = essayGradingMode === "ai_auto"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700";

                        return (
                          <div key={q.number} className={`glass-card rounded-xl p-4 space-y-3 border-l-4 ${borderColor}`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`flex items-center justify-center h-6 w-6 rounded-md text-xs font-bold ${numberBg}`}>
                                {q.number}
                              </span>
                              <Badge className={`rounded-md text-[10px] gap-0.5 ${
                                essayGradingMode === "ai_auto"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {essayGradingMode === "ai_auto" ? (
                                  <><Bot className="h-3 w-3" /> Esai — AI Grading</>
                                ) : (
                                  <><PenLine className="h-3 w-3" /> Esai — Manual</>
                                )}
                              </Badge>
                              {existingGrade ? (
                                <Badge
                                  variant="outline"
                                  className={`rounded-md text-[10px] gap-1 ${
                                    existingGrade.gradedBy === "ai"
                                      ? "border-blue-200 bg-blue-50 text-blue-700"
                                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  }`}
                                >
                                  {existingGrade.gradedBy === "ai" ? (
                                    <><Bot className="h-3 w-3" /> Dinilai AI — {existingGrade.score}/{existingGrade.maxScore}</>
                                  ) : (
                                    <><PenLine className="h-3 w-3" /> Dinilai Manual — {existingGrade.score}/{existingGrade.maxScore}</>
                                  )}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className={`rounded-md text-[10px] gap-1 animate-pulse ${
                                  essayGradingMode === "ai_auto"
                                    ? "border-blue-200 bg-blue-50 text-blue-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                                }`}>
                                  {essayGradingMode === "ai_auto" ? (
                                    <><Bot className="h-3 w-3" /> Menunggu AI</>
                                  ) : (
                                    <><PenLine className="h-3 w-3" /> Belum Dinilai</>
                                  )}
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                Maks {q.points} poin
                              </span>
                            </div>

                            {/* Question */}
                            <div className="text-sm [&_.markdown-body]:my-0 [&_.markdown-body_p]:my-0">
                              <MarkdownRenderer content={q.question} />
                            </div>

                            {/* Student answer */}
                            <div className="rounded-xl bg-muted/40 p-3">
                              <p className="text-[10px] font-semibold text-muted-foreground mb-1">Jawaban Mahasiswa:</p>
                              <p className="text-sm whitespace-pre-wrap">
                                {studentAnswer || <span className="text-muted-foreground italic">Tidak dijawab</span>}
                              </p>
                            </div>

                            {/* Correct answer reference */}
                            <details className="group">
                              <summary className="cursor-pointer text-[11px] font-medium text-emerald-700 hover:underline flex items-center gap-1">
                                <ChevronDown className="h-3 w-3 group-open:rotate-180 transition-transform" />
                                Lihat Kunci Jawaban
                              </summary>
                              <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3 mt-2">
                                <div className="text-sm text-emerald-800 [&_.markdown-body]:my-0 [&_.markdown-body_p]:my-0">
                                  <MarkdownRenderer content={q.correctAnswer} />
                                </div>
                              </div>
                            </details>

                            {/* Grading inputs */}
                            <div className="rounded-xl bg-muted/20 border border-border/50 p-3 space-y-3">
                              <div className="flex items-center gap-3">
                                <Label className="text-[11px] font-semibold shrink-0">Skor</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={q.points}
                                  value={gradingState[q.number]?.score ?? ""}
                                  onChange={(e) =>
                                    setGradingState((prev) => ({
                                      ...prev,
                                      [q.number]: {
                                        ...prev[q.number],
                                        score: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder={`0-${q.points}`}
                                  className="rounded-lg h-8 w-20 text-center"
                                />
                                <span className="text-xs text-muted-foreground">/ {q.points}</span>
                                <span className={`text-xs font-bold ${scoreColor}`}>
                                  {gradingState[q.number]?.score ? `${Math.round(scorePercent)}%` : ""}
                                </span>
                                {/* Quick score buttons */}
                                <div className="flex gap-1 ml-auto">
                                  {[0, Math.round(q.points * 0.5), q.points].map((v) => (
                                    <button
                                      key={v}
                                      type="button"
                                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                                        String(v) === gradingState[q.number]?.score
                                          ? "bg-primary text-primary-foreground border-primary"
                                          : "bg-background border-border hover:bg-accent"
                                      }`}
                                      onClick={() =>
                                        setGradingState((prev) => ({
                                          ...prev,
                                          [q.number]: {
                                            ...prev[q.number],
                                            score: String(v),
                                          },
                                        }))
                                      }
                                    >
                                      {v}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[11px] font-semibold">Feedback</Label>
                                <Textarea
                                  value={gradingState[q.number]?.feedback ?? ""}
                                  onChange={(e) =>
                                    setGradingState((prev) => ({
                                      ...prev,
                                      [q.number]: {
                                        ...prev[q.number],
                                        feedback: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Berikan catatan untuk mahasiswa..."
                                  rows={2}
                                  className="rounded-lg text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
