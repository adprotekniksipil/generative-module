"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Award,
  Hash,
  RotateCcw,
  Send,
  Bot,
  PenLine,
  Clock,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Maximize,
  AlertTriangle,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { useTopics } from "@/contexts/topics-context";
import type { QuizQuestion } from "@/lib/types";

interface QuizDetail {
  id: string;
  title: string;
  topic: string;
  subTopic: string;
  difficulty: string;
  examType: string;
  safeMode: boolean;
  questionCount: number;
  questionType: string;
  questions: QuizQuestion[];
  totalPoints: number;
  createdAt: string;
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

export default function StudentQuizPage() {
  const { getTopicLabel, getSubTopicLabel } = useTopics();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quiz state
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [lockedAttemptId, setLockedAttemptId] = useState<string | null>(null);
  const [lockedViolationCount, setLockedViolationCount] = useState(0);
  const [essayAnswers, setEssayAnswers] = useState<Record<number, string>>({});
  const [essayGrades, setEssayGrades] = useState<Record<number, {
    score: number;
    maxScore: number;
    feedback: string;
    gradedBy: "manual" | "ai";
  }> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/quizzes/${id}`).then((r) => r.json()),
      fetch(`/api/quizzes/${id}/attempts`).then((r) => r.ok ? r.json() : []),
    ])
      .then(([quizData, attemptsData]) => {
        setQuiz(quizData);
        if (Array.isArray(attemptsData) && quizData?.questions) {
          // Most recent incomplete attempt (locked or unlocked-but-not-submitted)
          const incomplete = attemptsData.find(
            (a: { lockedAt: string | null; completedAt: string | null }) => !a.completedAt
          );
          if (incomplete) {
            if (incomplete.lockedAt) {
              // Still locked — show locked screen
              setLockedAttemptId(incomplete.id);
              setLockedViolationCount(incomplete.violationCount ?? 0);
            }
            // Always pre-fill saved answers (locked or just-unlocked)
            try {
              const saved = JSON.parse(incomplete.answers ?? "{}");
              const mc: Record<number, string> = {};
              const essay: Record<number, string> = {};
              for (const q of quizData.questions) {
                if (q.type === "essay") essay[q.number] = saved[q.number] ?? "";
                else mc[q.number] = saved[q.number] ?? "";
              }
              setAnswers(mc);
              setEssayAnswers(essay);
            } catch {}
          }
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSelectAnswer = (questionNum: number, answer: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionNum]: answer }));
  };

  const handleEssayChange = (questionNum: number, value: string) => {
    if (submitted) return;
    setEssayAnswers((prev) => ({ ...prev, [questionNum]: value }));
  };

  const [aiGradingPending, setAiGradingPending] = useState(false);

  // ─── Safe Mode ───────────────────────────────────────────
  const [examStarted, setExamStarted] = useState(false);
  const [violations, setViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [lastViolationReason, setLastViolationReason] = useState("");
  const MAX_VIOLATIONS = 3;

  const isSafeMode = quiz?.safeMode ?? false;

  const requestFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  };

  const handleStartExam = () => {
    if (isSafeMode) requestFullscreen();
    setExamStarted(true);
  };

  const handleLock = async (currentViolations: number) => {
    if (!quiz) return;
    const allAnswers: Record<number, string> = {};
    for (const q of quiz.questions) {
      allAnswers[q.number] = q.type === "essay"
        ? (essayAnswers[q.number] ?? "")
        : (answers[q.number] ?? "");
    }
    try {
      const res = await fetch(`/api/quizzes/${id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: allAnswers, locked: true, violationCount: currentViolations }),
      });
      if (res.ok) {
        const data = await res.json();
        setLockedAttemptId(data.id);
      }
    } catch {}
    // Exit fullscreen
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };

  const recordViolation = (reason: string) => {
    setViolations((prev) => {
      const next = prev + 1;
      setLastViolationReason(reason);
      setShowViolationWarning(true);
      // Only lock exactly at MAX_VIOLATIONS, not on every subsequent violation
      if (next === MAX_VIOLATIONS && !submitted) {
        handleLock(next);
      }
      return next;
    });
  };

  // Attach safe mode listeners once exam is started
  useEffect(() => {
    if (!isSafeMode || !examStarted || submitted) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        recordViolation("Anda berpindah tab atau meminimalkan browser");
      }
    };

    const onBlur = () => {
      recordViolation("Anda berpindah ke aplikasi lain");
    };

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        recordViolation("Anda keluar dari mode layar penuh");
        // Re-request fullscreen after short delay
        setTimeout(requestFullscreen, 500);
      }
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      const blocked = [
        e.ctrlKey && e.key === "t",
        e.ctrlKey && e.key === "w",
        e.ctrlKey && e.key === "n",
        e.ctrlKey && e.key === "Tab",
        e.altKey && e.key === "Tab",
        e.key === "F11",
        e.key === "F5",
        e.ctrlKey && e.key === "r",
        e.ctrlKey && e.shiftKey && e.key === "i",
        e.ctrlKey && e.shiftKey && e.key === "j",
        e.key === "F12",
      ];
      if (blocked.some(Boolean)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSafeMode, examStarted, submitted]);

  // Exit fullscreen when exam is submitted
  useEffect(() => {
    if (submitted && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [submitted]);

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Save attempt to backend
    try {
      const allAnswers: Record<number, string> = {};
      for (const q of quiz.questions) {
        if (q.type === "essay") {
          allAnswers[q.number] = essayAnswers[q.number] ?? "";
        } else {
          allAnswers[q.number] = answers[q.number] ?? "";
        }
      }
      await fetch(`/api/quizzes/${id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: allAnswers }),
      });
    } catch {
      // Attempt save failed silently — student still sees local results
    }

    // Check for essay grades (may be from AI auto-grading)
    const hasEssay = quiz.questions.some((q) => q.type === "essay");
    if (hasEssay) {
      setAiGradingPending(true);
      // Poll for AI grading results (AI grading runs async in background)
      let retries = 0;
      const maxRetries = 10;
      const pollInterval = 3000; // 3 seconds
      const poll = async () => {
        try {
          const res = await fetch(`/api/quizzes/${id}/attempts`);
          if (res.ok) {
            const attempts = await res.json();
            if (attempts.length > 0 && attempts[0].essayGrades) {
              setEssayGrades(JSON.parse(attempts[0].essayGrades));
              setAiGradingPending(false);
              return;
            }
          }
        } catch {
          // ignore
        }
        retries++;
        if (retries < maxRetries) {
          setTimeout(poll, pollInterval);
        } else {
          setAiGradingPending(false);
        }
      };
      // First check after 2 seconds, then poll every 3s
      setTimeout(poll, 2000);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setEssayAnswers({});
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Calculate score
  const getScore = () => {
    if (!quiz) return { correct: 0, total: 0, points: 0, totalPoints: 0 };
    let correct = 0;
    let points = 0;
    for (const q of quiz.questions) {
      if (q.type === "essay") continue;
      const userAnswer = answers[q.number];
      if (userAnswer && userAnswer.startsWith(q.correctAnswer)) {
        correct++;
        points += q.points;
      }
    }
    const gradableQuestions = quiz.questions.filter((q) => q.type !== "essay");
    const totalPoints = gradableQuestions.reduce((sum, q) => sum + q.points, 0);
    return { correct, total: gradableQuestions.length, points, totalPoints };
  };

  const isAnswerCorrect = (q: QuizQuestion) => {
    const userAnswer = answers[q.number];
    return userAnswer && userAnswer.startsWith(q.correctAnswer);
  };

  const answeredCount = () => {
    if (!quiz) return 0;
    let count = 0;
    for (const q of quiz.questions) {
      if (q.type === "essay") {
        if (essayAnswers[q.number]?.trim()) count++;
      } else {
        if (answers[q.number]) count++;
      }
    }
    return count;
  };

  if (isLoading) {
    return (
      <>
        <Header title="Kuis" />
        <div className="p-6 space-y-4 max-w-4xl">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </>
    );
  }

  if (!quiz) {
    return (
      <>
        <Header title="Kuis Tidak Ditemukan" />
        <div className="p-6">
          <div className="glass-card rounded-2xl p-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Kuis tidak ditemukan.</p>
            <Button variant="outline" className="rounded-xl" onClick={() => router.push("/belajar/kuis")}>
              Kembali ke daftar kuis
            </Button>
          </div>
        </div>
      </>
    );
  }

  const score = getScore();

  // Safe mode: tampilkan layar TERKUNCI jika ada locked attempt
  if (isSafeMode && lockedAttemptId && !submitted) {
    return (
      <>
        <Header title={quiz.title} />
        <div className="p-6 max-w-xl space-y-5">
          <div className="glass-card rounded-2xl p-7 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 shrink-0">
                <ShieldAlert className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h2 className="font-semibold text-base">{quiz.title}</h2>
                <p className="text-xs text-rose-600 font-medium mt-0.5">Ujian Dikunci</p>
              </div>
            </div>

            <div className="rounded-xl bg-rose-50 border border-rose-200 p-5 space-y-3">
              <p className="text-sm font-semibold text-rose-700">Ujian Anda telah dikunci otomatis</p>
              <p className="text-sm text-rose-700">
                Pelanggaran safe browser terdeteksi sebanyak <strong>{lockedViolationCount || MAX_VIOLATIONS}x</strong>.
                Jawaban Anda sudah disimpan.
              </p>
              <p className="text-xs text-rose-600">
                Hubungi dosen/pengawas untuk meminta ujian dibuka kembali.
              </p>
            </div>

            <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Apa yang harus dilakukan:</p>
              <p>1. Hubungi dosen atau pengawas ujian</p>
              <p>2. Jelaskan situasi yang terjadi</p>
              <p>3. Dosen akan menentukan apakah ujian dapat dilanjutkan</p>
              <p>4. Setelah dibuka, refresh halaman ini untuk melanjutkan</p>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => router.push("/belajar/kuis")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Daftar Kuis
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Safe mode: tampilkan layar mulai ujian jika belum started
  if (isSafeMode && !examStarted && !lockedAttemptId) {
    return (
      <>
        <Header title={quiz.title} />
        <div className="p-6 max-w-xl space-y-5">
          <Button variant="ghost" className="rounded-xl gap-2" onClick={() => router.push("/belajar/kuis")}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>

          <div className="glass-card rounded-2xl p-7 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 shrink-0">
                <ShieldCheck className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h2 className="font-semibold text-base">{quiz.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {quiz.examType} &bull; {quiz.questionCount} soal &bull; {quiz.totalPoints} poin
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 space-y-2">
              <p className="text-sm font-semibold text-rose-700 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Perhatian: Safe Browser Mode Aktif
              </p>
              <ul className="text-xs text-rose-700 space-y-1 ml-6 list-disc">
                <li>Ujian akan dibuka dalam mode layar penuh</li>
                <li>Berpindah tab, window, atau aplikasi lain akan tercatat sebagai pelanggaran</li>
                <li>Keluar dari mode layar penuh akan tercatat sebagai pelanggaran</li>
                <li>Setelah <strong>{MAX_VIOLATIONS} pelanggaran</strong>, ujian akan dikumpulkan secara otomatis</li>
                <li>Klik kanan dan beberapa shortcut keyboard dinonaktifkan</li>
              </ul>
            </div>

            <div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground text-sm mb-2">Sebelum memulai:</p>
              <p>✓ Tutup semua tab dan aplikasi lain yang tidak diperlukan</p>
              <p>✓ Pastikan koneksi internet stabil</p>
              <p>✓ Siapkan kertas coret-coretan jika diperlukan</p>
            </div>

            <Button
              className="w-full rounded-xl h-12 gap-2"
              onClick={handleStartExam}
            >
              <Maximize className="h-4 w-4" /> Mulai Ujian (Layar Penuh)
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={quiz.title} />
      <div className="p-6 max-w-4xl space-y-5">
        {/* Violation warning overlay */}
        {showViolationWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-background rounded-2xl p-7 max-w-sm w-full mx-4 shadow-xl border-2 border-rose-400 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 shrink-0">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="font-bold text-rose-700">Pelanggaran Terdeteksi!</p>
                  <p className="text-xs text-muted-foreground">{lastViolationReason}</p>
                </div>
              </div>
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-rose-700">{violations} / {MAX_VIOLATIONS}</p>
                <p className="text-xs text-rose-600 mt-0.5">pelanggaran tercatat</p>
              </div>
              {violations >= MAX_VIOLATIONS ? (
                <p className="text-sm text-center text-muted-foreground">
                  Batas pelanggaran tercapai. Ujian dikumpulkan otomatis.
                </p>
              ) : (
                <p className="text-xs text-center text-muted-foreground">
                  Sisa {MAX_VIOLATIONS - violations} pelanggaran lagi sebelum ujian dikumpulkan otomatis.
                </p>
              )}
              <Button
                className="w-full rounded-xl"
                onClick={() => {
                  setShowViolationWarning(false);
                  if (isSafeMode && !document.fullscreenElement) requestFullscreen();
                }}
                disabled={violations >= MAX_VIOLATIONS}
              >
                Lanjutkan Ujian
              </Button>
            </div>
          </div>
        )}

        {/* Back button — sembunyikan saat safe mode aktif & belum submit */}
        {(!isSafeMode || submitted) && (
        <Button
          variant="ghost"
          className="rounded-xl gap-2"
          onClick={() => router.push("/belajar/kuis")}
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
        )}

        {/* Quiz info */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              className={`rounded-lg border ${
                quiz.examType === "UTS"
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : quiz.examType === "UAS"
                  ? "bg-rose-100 text-rose-700 border-rose-200"
                  : "bg-violet-100 text-violet-700 border-violet-200"
              }`}
            >
              {quiz.examType ?? "Quiz"}
            </Badge>
            {quiz.safeMode && !submitted && (
              <Badge className="rounded-lg bg-rose-100 text-rose-700 border border-rose-200 gap-1">
                <ShieldCheck className="h-3 w-3" />
                Safe Mode &bull; {violations}/{MAX_VIOLATIONS} pelanggaran
              </Badge>
            )}
            <Badge variant="secondary" className="rounded-lg gap-1">
              {getTopicLabel(quiz.topic)}
            </Badge>
            <Badge variant="outline" className="rounded-lg">
              {getSubTopicLabel(quiz.topic, quiz.subTopic)}
            </Badge>
            <Badge className={`rounded-lg border ${difficultyColors[quiz.difficulty] ?? ""}`}>
              {difficultyLabels[quiz.difficulty] ?? quiz.difficulty}
            </Badge>
            <div className="flex items-center gap-4 ml-auto text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" />
                {quiz.questionCount} soal
              </span>
              <span className="flex items-center gap-1">
                <Award className="h-3.5 w-3.5" />
                {quiz.totalPoints} poin
              </span>
            </div>
          </div>
        </div>

        {/* Score card (after submit) */}
        {submitted && (
          <div className="glass-card rounded-2xl p-6 border-2 border-primary/20 bg-primary/[0.03]">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-bold mb-1">Hasil Kuis</h3>
                <p className="text-sm text-muted-foreground">
                  Anda menjawab benar {score.correct} dari {score.total} soal
                  {quiz.questions.some((q) => q.type === "essay") && !essayGrades && " (tidak termasuk soal esai)"}
                  {quiz.questions.some((q) => q.type === "essay") && essayGrades && " (soal esai sudah dinilai)"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">
                  {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {score.points}/{score.totalPoints} poin
                </p>
              </div>
            </div>
            <div className="mt-4 w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{
                  width: `${score.total > 0 ? (score.correct / score.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Progress (before submit) */}
        {!submitted && (
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Dijawab: <strong>{answeredCount()}</strong> / {quiz.questionCount}
              </span>
              <div className="w-32 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${(answeredCount() / quiz.questionCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {quiz.questions.map((q) => {
            const userAnswer = answers[q.number];
            const correct = submitted && q.type !== "essay" ? isAnswerCorrect(q) : null;

            return (
              <div
                key={q.number}
                className={`glass-card rounded-2xl overflow-hidden transition-shadow ${
                  submitted && q.type !== "essay"
                    ? correct
                      ? "ring-2 ring-emerald-300"
                      : userAnswer
                        ? "ring-2 ring-rose-300"
                        : "ring-2 ring-amber-300"
                    : ""
                }`}
              >
                <div className="p-5">
                  {/* Question header */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                      {q.number}
                    </span>
                    <Badge variant="secondary" className="rounded-lg text-[11px]">
                      {typeLabel[q.type] ?? q.type}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {q.points} poin
                    </span>
                    {submitted && q.type !== "essay" && (
                      <span className="ml-auto">
                        {correct ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" /> Benar
                          </span>
                        ) : userAnswer ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-rose-600">
                            <XCircle className="h-4 w-4" /> Salah
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-amber-600">
                            Tidak dijawab
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Question text */}
                  <div className="text-sm leading-relaxed mb-4 [&_.markdown-body]:my-0 [&_.markdown-body_p]:my-0">
                    <MarkdownRenderer content={q.question} />
                  </div>

                  {/* Options (multiple choice / true-false) */}
                  {q.options && q.options.length > 0 && (
                    <div className="space-y-2">
                      {q.options.map((opt, i) => {
                        const isSelected = userAnswer === opt;
                        const isCorrectOption = submitted && opt.startsWith(q.correctAnswer);
                        const isWrongSelected = submitted && isSelected && !isCorrectOption;

                        let optionClass = "bg-muted/40 border border-transparent hover:border-primary/30 cursor-pointer";
                        if (submitted) {
                          if (isCorrectOption) {
                            optionClass = "bg-emerald-50 border border-emerald-200 text-emerald-800";
                          } else if (isWrongSelected) {
                            optionClass = "bg-rose-50 border border-rose-200 text-rose-800";
                          } else {
                            optionClass = "bg-muted/40 border border-transparent opacity-60";
                          }
                        } else if (isSelected) {
                          optionClass = "bg-primary/10 border border-primary/30 ring-2 ring-primary/20";
                        }

                        return (
                          <div
                            key={i}
                            className={`text-sm px-4 py-3 rounded-xl flex items-start gap-2.5 transition-all ${optionClass}`}
                            onClick={() => handleSelectAnswer(q.number, opt)}
                          >
                            {submitted && isCorrectOption && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                            )}
                            {submitted && isWrongSelected && (
                              <XCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                            )}
                            {!submitted && (
                              <div
                                className={`h-4 w-4 rounded-full border-2 mt-0.5 shrink-0 transition-colors ${
                                  isSelected
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground/30"
                                }`}
                              >
                                {isSelected && (
                                  <div className="h-full w-full rounded-full flex items-center justify-center">
                                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="[&_.markdown-body]:my-0 [&_.markdown-body_p]:my-0 flex-1 min-w-0">
                              <MarkdownRenderer content={opt} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay input */}
                  {q.type === "essay" && (
                    <div className="space-y-3">
                      <textarea
                        placeholder="Tulis jawaban Anda di sini..."
                        value={essayAnswers[q.number] ?? ""}
                        onChange={(e) => handleEssayChange(q.number, e.target.value)}
                        disabled={submitted}
                        className="w-full min-h-[120px] rounded-xl border border-border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-y disabled:opacity-60"
                      />
                      {submitted && essayGrades?.[q.number] && (
                        <div className={`rounded-xl p-3 border ${
                          essayGrades[q.number].gradedBy === "ai"
                            ? "bg-blue-50 border-blue-200"
                            : "bg-emerald-50 border-emerald-200"
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            {essayGrades[q.number].gradedBy === "ai" ? (
                              <Bot className="h-3.5 w-3.5 text-blue-600" />
                            ) : (
                              <PenLine className="h-3.5 w-3.5 text-emerald-600" />
                            )}
                            <span className="text-xs font-semibold">
                              {essayGrades[q.number].gradedBy === "ai" ? "Dinilai AI" : "Dinilai Dosen"}
                            </span>
                            <span className="text-xs font-bold ml-auto">
                              {essayGrades[q.number].score}/{essayGrades[q.number].maxScore} poin
                            </span>
                          </div>
                          {essayGrades[q.number].feedback && (
                            <p className="text-xs text-muted-foreground">{essayGrades[q.number].feedback}</p>
                          )}
                        </div>
                      )}
                      {submitted && !essayGrades?.[q.number] && (
                        <div className={`rounded-xl p-3 border ${
                          aiGradingPending
                            ? "bg-blue-50 border-blue-200"
                            : "bg-amber-50 border-amber-200"
                        }`}>
                          <div className="flex items-center gap-2">
                            {aiGradingPending ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                                <span className="text-xs font-medium text-blue-700">
                                  AI sedang menilai jawaban Anda...
                                </span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5 text-amber-600" />
                                <span className="text-xs font-medium text-amber-700">
                                  Menunggu penilaian dosen
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation (after submit) */}
                  {submitted && (
                    <div className="border-t border-border/50 pt-4 mt-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            Jawaban Benar
                          </p>
                          <div className="text-sm font-medium [&_.markdown-body]:my-0 [&_.markdown-body_p]:my-0">
                            <MarkdownRenderer content={q.correctAnswer} />
                          </div>
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          Pembahasan
                        </p>
                        <div className="text-sm text-muted-foreground leading-relaxed [&_.markdown-body_p]:my-1">
                          <MarkdownRenderer content={q.explanation} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 py-4">
          {!submitted ? (
            <Button
              className="rounded-xl gap-2 px-8"
              size="lg"
              onClick={handleSubmit}
              disabled={answeredCount() === 0}
            >
              <Send className="h-4 w-4" />
              Kirim Jawaban
            </Button>
          ) : (
            <Button
              variant="outline"
              className="rounded-xl gap-2 px-8"
              size="lg"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
              Kerjakan Ulang
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
