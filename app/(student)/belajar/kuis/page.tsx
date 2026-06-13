"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Calendar, Search, Hash, Award, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTopics } from "@/contexts/topics-context";

interface Quiz {
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

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-rose-100 text-rose-700",
};

const typeLabels: Record<string, string> = {
  multiple_choice: "Pilihan Ganda",
  essay: "Esai",
  true_false: "Benar/Salah",
  mixed: "Campuran",
};

export default function StudentQuizzesPage() {
  const { getTopicLabel, getSubTopicLabel } = useTopics();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/quizzes")
      .then((res) => res.json())
      .then(setQuizzes)
      .finally(() => setLoading(false));
  }, []);

  const filtered = quizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.subTopic.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Header title="Kuis" description="Uji pemahaman Anda" />
      <div className="p-6 space-y-5">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari kuis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </div>

        {/* Quizzes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "Tidak ada kuis yang cocok." : "Belum ada kuis tersedia."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((quiz) => (
              <Link key={quiz.id} href={`/belajar/kuis/${quiz.id}`}>
                <div className="glass-card rounded-2xl p-5 hover:shadow-soft-lg transition-all cursor-pointer group h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 shrink-0">
                      <ClipboardList className="h-5 w-5 text-violet-600" />
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {quiz.title}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Badge
                      className={`rounded-lg text-[11px] border ${
                        quiz.examType === "UTS"
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : quiz.examType === "UAS"
                          ? "bg-rose-100 text-rose-700 border-rose-200"
                          : "bg-violet-100 text-violet-700 border-violet-200"
                      }`}
                    >
                      {quiz.examType ?? "Quiz"}
                    </Badge>
                    {quiz.safeMode && (
                      <Badge className="rounded-lg text-[11px] bg-rose-100 text-rose-700 border border-rose-200 gap-1">
                        <ShieldCheck className="h-3 w-3" /> Safe
                      </Badge>
                    )}
                    <Badge variant="secondary" className="rounded-lg text-[11px]">
                      {getTopicLabel(quiz.topic)}
                    </Badge>
                    <Badge variant="outline" className="rounded-lg text-[11px]">
                      {getSubTopicLabel(quiz.topic, quiz.subTopic)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {quiz.questionCount} soal
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      {quiz.totalPoints} poin
                    </span>
                    <span>{typeLabels[quiz.questionType] ?? quiz.questionType}</span>
                  </div>
                  <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${difficultyColors[quiz.difficulty] ?? ""}`}>
                      {difficultyLabels[quiz.difficulty] ?? quiz.difficulty}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(quiz.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
