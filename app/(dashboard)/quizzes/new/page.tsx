"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sparkles,
  Settings2,
  CheckCircle2,
  Circle,
  ListChecks,
  Bot,
  PenLine,
  BookOpen,
  ClipboardList,
  Sliders,
  Users,
  ShieldAlert,
  Zap,
  FileText,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { VisibilitySelector } from "@/components/visibility/visibility-selector";
import { Header } from "@/components/layout/header";
import { TopicSelector } from "@/components/generation/topic-selector";
import { GenerationConfig } from "@/components/generation/generation-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { QUESTION_TYPES } from "@/lib/constants/topics";
import type {
  Difficulty,
  Language,
  QuestionType,
  ExamType,
  QuizQuestion,
} from "@/lib/types";

const GENERATING_TIPS = [
  "AI sedang menganalisis topik dan kurikulum teknik sipil...",
  "Menyusun soal sesuai level Bloom's Taxonomy...",
  "Memverifikasi akurasi teknis setiap soal...",
  "Menyiapkan kunci jawaban dan pembahasan...",
  "Hampir selesai, menyusun output akhir...",
];

export default function NewQuizPage() {
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [subTopic, setSubTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [language, setLanguage] = useState<Language>("id");
  const [customInstructions, setCustomInstructions] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [questionType, setQuestionType] = useState<QuestionType>("mixed");
  const [examType, setExamType] = useState<ExamType>("Quiz");
  const [safeMode, setSafeMode] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<{
    title: string;
    questions: QuizQuestion[];
  } | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(
    new Set()
  );
  const [isPublished, setIsPublished] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [essayGradingMode, setEssayGradingMode] = useState<
    "manual" | "ai_auto"
  >("manual");
  const [configOpen, setConfigOpen] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);

  const handleGenerate = async () => {
    if (!topic || !subTopic) {
      toast.error("Pilih bidang dan sub-topik terlebih dahulu");
      return;
    }
    setIsGenerating(true);
    setGeneratedQuiz(null);
    setExpandedQuestions(new Set());
    setTipIndex(0);

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % GENERATING_TIPS.length);
    }, 2800);

    try {
      const res = await fetch("/api/generate/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          subTopic,
          difficulty,
          language,
          questionCount,
          questionType,
          customInstructions,
        }),
      });
      if (!res.ok) throw new Error("Gagal generate soal");
      const data = await res.json();
      setGeneratedQuiz(data);
      setConfigOpen(false);
      toast.success(`${data.questions.length} soal berhasil di-generate`);
    } catch {
      toast.error("Gagal men-generate soal. Silakan coba lagi.");
    } finally {
      clearInterval(tipInterval);
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedQuiz) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedQuiz.title,
          topic,
          subTopic,
          difficulty,
          language,
          examType,
          safeMode,
          questionCount,
          questionType,
          questions: generatedQuiz.questions,
          isPublished,
          groupIds: selectedGroupIds,
          essayGradingMode,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      const data = await res.json();
      toast.success("Soal berhasil disimpan");
      router.push(`/quizzes/${data.id}`);
    } catch {
      toast.error("Gagal menyimpan soal");
    } finally {
      setIsSaving(false);
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

  const toggleAll = () => {
    if (!generatedQuiz) return;
    if (expandedQuestions.size === generatedQuiz.questions.length) {
      setExpandedQuestions(new Set());
    } else {
      setExpandedQuestions(
        new Set(generatedQuiz.questions.map((q) => q.number))
      );
    }
  };

  const typeLabel: Record<string, string> = {
    multiple_choice: "Pilihan Ganda",
    essay: "Esai",
    true_false: "Benar/Salah",
  };

  const typeColor: Record<string, string> = {
    multiple_choice: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
    essay: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    true_false: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  };

  const examTypeConfig: Record<ExamType, { color: string; dot: string }> = {
    Quiz: {
      color: "border-violet-400 bg-violet-50/60 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
      dot: "bg-violet-400",
    },
    UTS: {
      color: "border-amber-400 bg-amber-50/60 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      dot: "bg-amber-400",
    },
    UAS: {
      color: "border-rose-400 bg-rose-50/60 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
      dot: "bg-rose-400",
    },
  };

  const totalPoints = generatedQuiz
    ? generatedQuiz.questions.reduce((sum, q) => sum + q.points, 0)
    : 0;

  return (
    <>
      <Header title="Buat Soal Ujian" />
      <div className="p-6 max-w-4xl space-y-4">

        {/* Config panel */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Panel header / toggle */}
          <button
            type="button"
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/30 transition-colors"
            onClick={() => setConfigOpen(!configOpen)}
            aria-expanded={configOpen}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Settings2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold leading-none">Pengaturan Generate</p>
                {!configOpen && generatedQuiz && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {generatedQuiz.questions.length} soal &middot; {examType} &middot; {subTopic || topic}
                  </p>
                )}
              </div>
              {!configOpen && generatedQuiz && (
                <Badge variant="secondary" className="rounded-full text-[10px] px-2">
                  selesai dikonfigurasi
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-[11px]">{configOpen ? "Sembunyikan" : "Tampilkan"}</span>
              {configOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </button>

          {configOpen && (
            <div className="border-t divide-y divide-border/60">

              {/* Step 1 — Topik */}
              <div className="px-5 py-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    1
                  </span>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">Topik Soal</h4>
                  </div>
                </div>
                <TopicSelector
                  topic={topic}
                  subTopic={subTopic}
                  onTopicChange={(v) => {
                    setTopic(v);
                    setSubTopic("");
                  }}
                  onSubTopicChange={setSubTopic}
                />
              </div>

              {/* Step 2 — Tipe Ujian */}
              <div className="px-5 py-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    2
                  </span>
                  <div className="flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">Tipe Ujian</h4>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {(["Quiz", "UTS", "UAS"] as ExamType[]).map((type) => {
                    const isSelected = examType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setExamType(type);
                          if (type === "Quiz") setSafeMode(false);
                        }}
                        className={`relative flex flex-col items-center gap-1.5 rounded-xl py-3.5 border-2 transition-all ${
                          isSelected
                            ? examTypeConfig[type].color
                            : "border-border text-muted-foreground hover:border-primary/30 hover:bg-accent/30"
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        )}
                        <span className="text-base font-bold">{type}</span>
                        <span className="text-[10px] font-medium opacity-70">
                          {type === "Quiz" ? "Kuis harian" : type === "UTS" ? "Tengah semester" : "Akhir semester"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {examType !== "Quiz" && (
                  <button
                    type="button"
                    onClick={() => setSafeMode((v) => !v)}
                    className={`mt-3 w-full flex items-center gap-3 rounded-xl px-4 py-3.5 border-2 transition-all text-left ${
                      safeMode
                        ? "border-rose-400 bg-rose-50/60 dark:bg-rose-950/40"
                        : "border-border hover:border-rose-300"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${safeMode ? "bg-rose-500/15" : "bg-muted"}`}>
                      <ShieldAlert className={`h-4 w-4 ${safeMode ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${safeMode ? "text-rose-700 dark:text-rose-400" : ""}`}>
                        Safe Browser Mode
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Deteksi pindah tab/window selama ujian berlangsung
                      </p>
                    </div>
                    <div
                      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${safeMode ? "bg-rose-500" : "bg-muted-foreground/30"}`}
                      aria-hidden="true"
                    >
                      <div
                        className={`absolute top-0 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${safeMode ? "translate-x-4" : "translate-x-0"}`}
                      />
                    </div>
                  </button>
                )}
              </div>

              {/* Step 3 — Konfigurasi Soal */}
              <div className="px-5 py-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    3
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">Konfigurasi Soal</h4>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Jumlah Soal
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={questionCount}
                          onChange={(e) =>
                            setQuestionCount(parseInt(e.target.value) || 10)
                          }
                          className="rounded-xl pr-12"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          soal
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tipe Soal</Label>
                      <Select
                        value={questionType}
                        onValueChange={(v) =>
                          setQuestionType(v as QuestionType)
                        }
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {QUESTION_TYPES.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <GenerationConfig
                    difficulty={difficulty}
                    depth="standard"
                    language={language}
                    customInstructions={customInstructions}
                    onDifficultyChange={setDifficulty}
                    onDepthChange={() => {}}
                    onLanguageChange={setLanguage}
                    onCustomInstructionsChange={setCustomInstructions}
                    showDepth={false}
                  />
                </div>

                {/* Mode Penilaian Esai — inline di Step 3 */}
                {(questionType === "essay" || questionType === "mixed") && (
                  <div className="mt-4 pt-4 border-t border-border/60">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Mode Penilaian Esai
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        className={`text-left rounded-xl p-4 border-2 transition-all ${
                          essayGradingMode === "manual"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                        onClick={() => setEssayGradingMode("manual")}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${essayGradingMode === "manual" ? "bg-primary/10" : "bg-muted"}`}>
                            <PenLine className={`h-3.5 w-3.5 ${essayGradingMode === "manual" ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <span className="text-sm font-semibold">Manual</span>
                          {essayGradingMode === "manual" && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-auto" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Dosen menilai jawaban esai satu per satu.
                        </p>
                      </button>

                      <button
                        type="button"
                        className={`text-left rounded-xl p-4 border-2 transition-all ${
                          essayGradingMode === "ai_auto"
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                            : "border-border hover:border-blue-300"
                        }`}
                        onClick={() => setEssayGradingMode("ai_auto")}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${essayGradingMode === "ai_auto" ? "bg-blue-500/10" : "bg-muted"}`}>
                            <Bot className={`h-3.5 w-3.5 ${essayGradingMode === "ai_auto" ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
                          </div>
                          <span className="text-sm font-semibold">AI Otomatis</span>
                          {essayGradingMode === "ai_auto" && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 ml-auto" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          AI menilai otomatis saat mahasiswa submit. Dosen bisa override.
                        </p>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 4 — Visibilitas */}
              <div className="px-5 py-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    4
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">Visibilitas & Kelas</h4>
                  </div>
                </div>
                <VisibilitySelector
                  isPublished={isPublished}
                  selectedGroupIds={selectedGroupIds}
                  onPublishChange={setIsPublished}
                  onGroupsChange={setSelectedGroupIds}
                />
              </div>

            </div>
          )}
        </div>

        {/* Generate button — primary action */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`w-full relative overflow-hidden rounded-xl h-14 text-sm font-semibold transition-all flex items-center justify-center gap-2.5 shadow-md
            ${isGenerating
              ? "bg-primary/70 text-primary-foreground cursor-not-allowed"
              : "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground hover:shadow-lg active:scale-[0.99] cursor-pointer"
            }`}
          aria-label={isGenerating ? `Sedang men-generate ${questionCount} soal` : generatedQuiz ? "Re-generate soal" : "Generate soal"}
        >
          {/* shimmer overlay saat idle */}
          {!isGenerating && (
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
          )}
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>Sedang men-generate {questionCount} soal...</span>
            </>
          ) : generatedQuiz ? (
            <>
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Re-generate Soal</span>
              <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium">
                {questionCount} soal
              </span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Generate Soal dengan AI</span>
              <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium">
                {questionCount} soal
              </span>
            </>
          )}
        </button>

        {/* Loading state */}
        {isGenerating && (
          <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/15" />
              <span className="absolute inline-flex h-10 w-10 animate-ping rounded-full bg-primary/10 animation-delay-150" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              </div>
            </div>

            <div className="text-center space-y-1 max-w-xs">
              <p className="text-sm font-semibold">Membuat {questionCount} soal...</p>
              <p className="text-xs text-muted-foreground/80 leading-relaxed transition-all duration-500">
                {GENERATING_TIPS[tipIndex]}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5">
              {GENERATING_TIPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === tipIndex
                      ? "w-5 bg-primary"
                      : i < tipIndex
                      ? "w-1.5 bg-primary/40"
                      : "w-1.5 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {generatedQuiz && !isGenerating && (
          <div className="space-y-3">
            {/* Results header */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold leading-snug">
                  {generatedQuiz.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant="outline" className="rounded-full text-[10px] gap-1 px-2 py-0.5">
                    <FileText className="h-3 w-3" />
                    {generatedQuiz.questions.length} soal
                  </Badge>
                  <Badge variant="outline" className="rounded-full text-[10px] gap-1 px-2 py-0.5">
                    <Zap className="h-3 w-3" />
                    {totalPoints} poin
                  </Badge>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${examTypeConfig[examType].color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${examTypeConfig[examType].dot}`} />
                    {examType}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl gap-1.5 text-xs shrink-0"
                onClick={toggleAll}
              >
                <ListChecks className="h-3.5 w-3.5" />
                {expandedQuestions.size === generatedQuiz.questions.length
                  ? "Tutup Semua"
                  : "Buka Semua"}
              </Button>
            </div>

            {/* Question cards */}
            {generatedQuiz.questions.map((q) => {
              const isExpanded = expandedQuestions.has(q.number);
              return (
                <div
                  key={q.number}
                  className="glass-card rounded-2xl overflow-hidden"
                >
                  <button
                    type="button"
                    className="w-full text-left p-4 hover:bg-accent/30 transition-colors"
                    onClick={() => toggleQuestion(q.number)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Number badge */}
                      <span className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                        {q.number}
                      </span>

                      <div className="flex-1 min-w-0">
                        {/* Meta row */}
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              typeColor[q.type] ?? "bg-muted text-muted-foreground border-transparent"
                            }`}
                          >
                            {typeLabel[q.type] ?? q.type}
                          </span>
                          {q.bloomLevel && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/60">
                              {q.bloomLevel}
                            </span>
                          )}
                          <span className="ml-auto text-[10px] font-semibold text-muted-foreground tabular-nums">
                            {q.points} poin
                          </span>
                        </div>

                        {/* Question text */}
                        <div className="text-sm leading-relaxed [&_.markdown-body]:my-0 [&_.markdown-body_p]:my-0 [&_.markdown-body_p]:leading-relaxed">
                          <MarkdownRenderer content={q.question} />
                        </div>
                      </div>

                      <div className="flex-shrink-0 mt-1">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 ml-10 space-y-3 border-t pt-3">
                      {/* Options */}
                      {q.options && q.options.length > 0 && (
                        <div className="space-y-1.5">
                          {q.options.map((opt, i) => {
                            const isCorrect = opt.startsWith(q.correctAnswer);
                            return (
                              <div
                                key={i}
                                className={`flex items-start gap-2 text-sm p-2.5 rounded-xl ${
                                  isCorrect
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                                    : "bg-muted/40"
                                }`}
                              >
                                {isCorrect ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0 [&_.markdown-body]:my-0 [&_.markdown-body_p]:my-0">
                                  <MarkdownRenderer content={opt} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Answer + explanation */}
                      <div className="rounded-xl bg-muted/30 p-3.5 space-y-3">
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Jawaban Benar
                          </p>
                          <div className="text-sm font-medium [&_.markdown-body]:my-0 [&_.markdown-body_p]:my-0">
                            <MarkdownRenderer content={q.correctAnswer} />
                          </div>
                        </div>
                        <div className="border-t border-border/40 pt-3">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Pembahasan
                          </p>
                          <div className="text-sm text-muted-foreground leading-relaxed [&_.markdown-body]:my-0 [&_.markdown-body_p]:my-1 [&_.markdown-body_p]:leading-relaxed">
                            <MarkdownRenderer content={q.explanation} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Sticky save bar */}
            <div className="sticky bottom-4 z-10 pt-2">
              <div className="glass-card rounded-xl border shadow-xl overflow-hidden">
                <div className="flex items-center gap-4 px-4 py-3">
                  {/* Summary stats */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-none">
                        {generatedQuiz.questions.length} soal siap disimpan
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {totalPoints} poin &middot; {examType}
                        {safeMode && " &middot; Safe Mode"}
                        {isPublished ? " &middot; Dipublish" : " &middot; Draft"}
                      </p>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="default"
                    className="rounded-xl gap-2 shrink-0 min-w-[130px]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Simpan Soal
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
