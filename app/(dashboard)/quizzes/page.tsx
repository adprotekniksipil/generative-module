"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Trash2, Calendar, ShieldCheck, Eye } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useTopics } from "@/contexts/topics-context";

interface QuizListItem {
  id: string;
  title: string;
  topic: string;
  subTopic: string;
  difficulty: string;
  examType: string;
  safeMode: boolean;
  questionCount: number;
  questionType: string;
  totalPoints: number;
  createdAt: string;
}

const difficultyLabels: Record<string, string> = {
  beginner: "Dasar",
  intermediate: "Menengah",
  advanced: "Lanjut",
};

const typeLabels: Record<string, string> = {
  multiple_choice: "Pilihan Ganda",
  essay: "Esai",
  true_false: "Benar/Salah",
  mixed: "Campuran",
};

export default function QuizzesListPage() {
  const { getTopicLabel, getSubTopicLabel } = useTopics();
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/quizzes")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setQuizzes)
      .catch((err) => {
        console.error("Gagal memuat kuis:", err);
        toast.error("Gagal memuat daftar kuis");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus soal "${title}"?`)) return;

    try {
      await fetch(`/api/quizzes/${id}`, { method: "DELETE" });
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
      toast.success("Soal berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus soal");
    }
  };

  return (
    <>
      <Header title="Daftar Soal" />
      <div className="p-6 space-y-4">
        {/* Header area */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Memuat..." : `${quizzes.length} soal tersimpan`}
          </p>
          <Link href="/quizzes/new" className={cn(buttonVariants(), "rounded-xl gap-1.5")}>
            <Plus className="h-4 w-4" /> Buat Soal Baru
          </Link>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          /* Empty state */
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center text-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <ClipboardList className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">Belum ada soal</h3>
            <p className="text-sm text-muted-foreground">
              Mulai buat soal ujian atau kuis menggunakan AI
            </p>
            <Link href="/quizzes/new" className={cn(buttonVariants(), "rounded-xl gap-1.5 mt-1")}>
              <Plus className="h-4 w-4" /> Buat Soal Pertama
            </Link>
          </div>
        ) : (
          /* List */
          <div className="space-y-3">
            {quizzes.map((q) => (
              <div
                key={q.id}
                className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                  <ClipboardList className="h-5 w-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Baris 1: judul + badge utama */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-sm truncate">{q.title}</h3>
                    <Badge
                      className={`rounded-lg text-[11px] border ${
                        q.examType === "UTS"
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : q.examType === "UAS"
                          ? "bg-rose-100 text-rose-700 border-rose-200"
                          : "bg-violet-100 text-violet-700 border-violet-200"
                      }`}
                    >
                      {q.examType ?? "Quiz"}
                    </Badge>
                    {q.safeMode && (
                      <Badge className="rounded-lg text-[11px] bg-rose-100 text-rose-700 border border-rose-200 gap-1">
                        <ShieldCheck className="h-3 w-3" /> Safe
                      </Badge>
                    )}
                    <Badge variant="secondary" className="rounded-lg text-[11px]">
                      {difficultyLabels[q.difficulty] ?? q.difficulty}
                    </Badge>
                  </div>
                  {/* Baris 2: metadata */}
                  <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span>{getTopicLabel(q.topic)}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{getSubTopicLabel(q.topic, q.subTopic)}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{typeLabels[q.questionType] ?? q.questionType}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{q.questionCount} soal · {q.totalPoints} poin</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(q.createdAt).toLocaleDateString("id-ID")}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/quizzes/${q.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl gap-1.5 text-xs")}>
                    <Eye className="h-3.5 w-3.5" /> Lihat
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-muted-foreground hover:text-destructive"
                    aria-label="Hapus soal"
                    onClick={() => handleDelete(q.id, q.title)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
