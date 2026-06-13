"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  ClipboardList,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Trophy,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";

interface EvalData {
  overview: {
    totalAttempts: number;
    uniqueQuizzes: number;
    avgScore: number;
    highestScore: number;
    passRate: number;
  };
  topicStats: Array<{
    topic: string;
    attemptCount: number;
    avgScore: number;
    passRate: number;
  }>;
  recentAttempts: Array<{
    id: string;
    quizId: string;
    quizTitle: string;
    topic: string;
    subTopic: string;
    difficulty: string;
    questionType: string;
    score: number;
    totalPoints: number;
    percentage: number;
    completedAt: string | null;
  }>;
  distribution: number[];
  progressTimeline: Array<{
    date: string;
    avgScore: number;
    count: number;
  }>;
}

const DISTRIBUTION_LABELS = ["0-20", "21-40", "41-60", "61-80", "81-100"];
const DISTRIBUTION_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-blue-500",
  "bg-emerald-500",
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

function scoreBg(score: number) {
  if (score >= 80) return "bg-emerald-500/10";
  if (score >= 60) return "bg-blue-500/10";
  if (score >= 40) return "bg-amber-500/10";
  return "bg-red-500/10";
}

function difficultyLabel(d: string) {
  const map: Record<string, string> = {
    beginner: "Dasar",
    intermediate: "Menengah",
    advanced: "Lanjut",
  };
  return map[d] || d;
}

function gradeLabel(score: number) {
  if (score >= 85) return { label: "A", color: "text-emerald-600 bg-emerald-500/10" };
  if (score >= 75) return { label: "B", color: "text-blue-600 bg-blue-500/10" };
  if (score >= 60) return { label: "C", color: "text-amber-600 bg-amber-500/10" };
  if (score >= 40) return { label: "D", color: "text-orange-600 bg-orange-500/10" };
  return { label: "E", color: "text-red-600 bg-red-500/10" };
}

export default function StudentEvalPage() {
  const [data, setData] = useState<EvalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/reports/student");
        if (res.ok) setData(await res.json());
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <Header title="Evaluasi Saya" description="Performa dan riwayat kuis Anda" />
        <div className="p-6">
          <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">
            Memuat data evaluasi...
          </div>
        </div>
      </>
    );
  }

  if (!data || data.overview.totalAttempts === 0) {
    return (
      <>
        <Header title="Evaluasi Saya" description="Performa dan riwayat kuis Anda" />
        <div className="p-6">
          <div className="glass-card rounded-2xl p-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">Belum Ada Riwayat</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Anda belum mengerjakan kuis apapun. Kerjakan kuis untuk melihat evaluasi performa Anda.
            </p>
            <Link
              href="/belajar/kuis"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Lihat Daftar Kuis <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </>
    );
  }

  const { overview, topicStats, recentAttempts, distribution, progressTimeline } = data;
  const maxDist = Math.max(...distribution, 1);
  const grade = gradeLabel(overview.avgScore);

  return (
    <>
      <Header title="Evaluasi Saya" description="Performa dan riwayat kuis Anda" />
      <div className="p-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                <ClipboardList className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Kuis</p>
                <p className="text-2xl font-bold">{overview.totalAttempts}</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Kuis Berbeda</p>
                <p className="text-2xl font-bold">{overview.uniqueQuizzes}</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${scoreBg(overview.avgScore)}`}>
                <TrendingUp className={`h-5 w-5 ${scoreColor(overview.avgScore)}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Rata-rata</p>
                <p className={`text-2xl font-bold ${scoreColor(overview.avgScore)}`}>
                  {overview.avgScore}%
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Trophy className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Skor Tertinggi</p>
                <p className="text-2xl font-bold text-emerald-600">{overview.highestScore}%</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${grade.color.split(" ")[1]}`}>
                <Award className={`h-5 w-5 ${grade.color.split(" ")[0]}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Nilai Rata-rata</p>
                <p className={`text-2xl font-bold ${grade.color.split(" ")[0]}`}>{grade.label}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Distribution */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
              Distribusi Skor Anda
            </h3>
            <div className="space-y-3">
              {distribution.map((count, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-12 text-right font-medium">
                    {DISTRIBUTION_LABELS[i]}
                  </span>
                  <div className="flex-1 bg-muted/50 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full ${DISTRIBUTION_COLORS[i]} rounded-full flex items-center justify-end pr-2 transition-all`}
                      style={{ width: `${Math.max((count / maxDist) * 100, count > 0 ? 12 : 0)}%` }}
                    >
                      {count > 0 && (
                        <span className="text-[10px] font-bold text-white">{count}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Performance */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
              Performa per Bidang
            </h3>
            {topicStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada data</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topicStats
                  .sort((a, b) => b.attemptCount - a.attemptCount)
                  .map((t) => (
                    <div key={t.topic} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium truncate">{t.topic}</p>
                        <Badge variant="secondary" className="rounded-md text-[10px] shrink-0 ml-2">
                          {t.attemptCount}x
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 bg-muted/50 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${t.avgScore >= 60 ? "bg-emerald-500" : "bg-amber-500"}`}
                            style={{ width: `${t.avgScore}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${scoreColor(t.avgScore)}`}>
                          {t.avgScore}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        {t.passRate >= 60 ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-amber-500" />
                        )}
                        Lulus: {t.passRate}%
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress Timeline */}
        {progressTimeline.length > 1 && (
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
              Progress Harian
            </h3>
            <div className="flex items-end gap-1 h-32">
              {progressTimeline.slice(-14).map((day) => {
                const height = Math.max(day.avgScore, 5);
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-8 hidden group-hover:block bg-foreground text-background text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-10">
                      {formatDate(day.date)}: {day.avgScore}% ({day.count}x)
                    </div>
                    <div
                      className={`w-full rounded-t-md ${day.avgScore >= 60 ? "bg-emerald-500" : "bg-amber-500"} transition-all hover:opacity-80`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                      {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Attempts */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
            Riwayat Kuis
          </h3>
          <div className="glass-card rounded-2xl divide-y divide-border/50">
            {recentAttempts.map((a) => (
              <Link
                key={a.id}
                href={`/belajar/kuis/${a.quizId}`}
                className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${scoreBg(a.percentage)}`}>
                    {a.percentage >= 60 ? (
                      <CheckCircle2 className={`h-5 w-5 ${scoreColor(a.percentage)}`} />
                    ) : (
                      <XCircle className={`h-5 w-5 ${scoreColor(a.percentage)}`} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{a.quizTitle}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{a.subTopic}</span>
                      <Badge variant="outline" className="rounded-md text-[10px] px-1.5 py-0">
                        {difficultyLabel(a.difficulty)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-2">
                  <div className="text-right">
                    <p className={`text-sm font-bold ${scoreColor(a.percentage)}`}>
                      {a.percentage}%
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {a.score}/{a.totalPoints} poin
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {a.completedAt ? formatDate(a.completedAt) : "-"}
                  </div>
                </div>
              </Link>
            ))}
            {recentAttempts.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Belum ada riwayat kuis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
