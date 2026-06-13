"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  ChevronRight,
  Calendar,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HeroStudentIllustration, StatMaterialIcon, StatQuizIcon, ActionLearnArt, ActionTestArt } from "@/components/ui/illustrations";
import { Header } from "@/components/layout/header";

interface Stats {
  materialCount: number;
  quizCount: number;
  recentMaterials: Array<{
    id: string;
    title: string;
    topic: string;
    subTopic: string;
    createdAt: string;
  }>;
  recentQuizzes: Array<{
    id: string;
    title: string;
    topic: string;
    questionCount: number;
    createdAt: string;
  }>;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function StudentHomePage() {
  const [stats, setStats] = useState<Stats>({
    materialCount: 0,
    quizCount: 0,
    recentMaterials: [],
    recentQuizzes: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [matRes, quizRes] = await Promise.all([
          fetch("/api/materials"),
          fetch("/api/quizzes"),
        ]);
        const materials = await matRes.json();
        const quizzes = await quizRes.json();
        setStats({
          materialCount: materials.length ?? 0,
          quizCount: quizzes.length ?? 0,
          recentMaterials: (materials ?? []).slice(0, 5),
          recentQuizzes: (quizzes ?? []).slice(0, 5),
        });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <>
      <Header title="Beranda" description="Portal Belajar Teknik Sipil" />
      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div className="relative overflow-hidden rounded-3xl bg-[#155d50] p-6 md:p-8 text-white shadow-sm border border-[#237566]">
          <div className="relative z-10 max-w-lg">
            <h2 className="text-xl md:text-2xl font-bold mb-2">Selamat Belajar!</h2>
            <p className="text-sm text-emerald-50/90 leading-relaxed font-light">
              Jelajahi materi pembelajaran dan kerjakan kuis untuk menguji
              pemahaman Anda di berbagai bidang teknik sipil.
            </p>
          </div>
          {/* Hero Illustration */}
          <HeroStudentIllustration />
          {/* Badge */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 hidden lg:flex items-center gap-1.5 rounded-full bg-white/95 text-slate-800 px-3 py-1.5 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-semibold">Mode Mahasiswa</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/belajar/materi">
            <div className="glass-card rounded-[2rem] p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden bg-white/90 border border-slate-100 flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">Materi Tersedia</h3>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1 leading-none mt-2">
                  {loading ? "..." : stats.materialCount}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-2">
                  <TrendingUp className="h-3 w-3" /> Eksplorasi modul
                </div>
              </div>
              <div className="shrink-0 relative w-16 h-16 flex items-center justify-center transition-transform group-hover:scale-105">
                <StatMaterialIcon className="w-16 h-16" />
              </div>
            </div>
          </Link>

          <Link href="/belajar/kuis">
            <div className="glass-card rounded-[2rem] p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden bg-white/90 border border-slate-100 flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                    <ClipboardList className="h-4 w-4 text-violet-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">Kuis Tersedia</h3>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1 leading-none mt-2">
                  {loading ? "..." : stats.quizCount}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-violet-600 font-medium mt-2">
                  <TrendingUp className="h-3 w-3" /> Uji pemahaman
                </div>
              </div>
              <div className="shrink-0 relative w-16 h-16 flex items-center justify-center transition-transform group-hover:scale-105">
                <StatQuizIcon className="w-16 h-16" />
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-slate-800 uppercase tracking-wider">
            Mulai Belajar
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/belajar/materi">
              <div className="relative overflow-hidden rounded-[1.5rem] bg-[#1E6051] p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group min-h-[140px] text-white flex flex-col justify-between border border-transparent hover:border-white/10">
                <ActionLearnArt />
                <div className="relative z-10 w-full mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-md mb-3 ring-1 ring-white/20">
                    <BookOpen className="h-5 w-5 text-emerald-50" />
                  </div>
                </div>
                <div className="relative z-10">
                  <h4 className="text-[15px] font-bold mb-1 tracking-tight">Pelajari Materi</h4>
                  <p className="text-[12px] text-emerald-50/80 leading-snug font-medium max-w-[85%]">Baca modul pembelajaran teknik sipil sesuai topik</p>
                </div>
              </div>
            </Link>
            <Link href="/belajar/kuis">
              <div className="relative overflow-hidden rounded-[1.5rem] bg-[#237060] p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group min-h-[140px] text-white flex flex-col justify-between border border-transparent hover:border-white/10">
                <ActionTestArt />
                <div className="relative z-10 w-full mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-md mb-3 ring-1 ring-white/20">
                    <ClipboardList className="h-5 w-5 text-emerald-50" />
                  </div>
                </div>
                <div className="relative z-10">
                  <h4 className="text-[15px] font-bold mb-1 tracking-tight">Kerjakan Kuis</h4>
                  <p className="text-[12px] text-emerald-50/80 leading-snug font-medium max-w-[85%]">Uji pemahaman dengan soal PG dan Esai interaktif</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Materials */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Materi Terbaru
              </h3>
              <Link
                href="/belajar/materi"
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
              >
                Semua <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="glass-card rounded-2xl divide-y divide-border/50">
              {loading ? (
                <div className="p-5 text-center text-sm text-muted-foreground">
                  Memuat...
                </div>
              ) : stats.recentMaterials.length === 0 ? (
                <div className="p-5 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Belum ada materi tersedia.
                  </p>
                </div>
              ) : (
                stats.recentMaterials.map((mat) => (
                  <Link
                    key={mat.id}
                    href={`/belajar/materi/${mat.id}`}
                    className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{mat.title}</p>
                        <p className="text-xs text-muted-foreground">{mat.subTopic}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 ml-2">
                      <Calendar className="h-3 w-3" />
                      {formatDate(mat.createdAt)}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Quizzes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Kuis Terbaru
              </h3>
              <Link
                href="/belajar/kuis"
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
              >
                Semua <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="glass-card rounded-2xl divide-y divide-border/50">
              {loading ? (
                <div className="p-5 text-center text-sm text-muted-foreground">
                  Memuat...
                </div>
              ) : stats.recentQuizzes.length === 0 ? (
                <div className="p-5 text-center">
                  <ClipboardList className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Belum ada kuis tersedia.
                  </p>
                </div>
              ) : (
                stats.recentQuizzes.map((quiz) => (
                  <Link
                    key={quiz.id}
                    href={`/belajar/kuis/${quiz.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                      <ClipboardList className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{quiz.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {quiz.questionCount} soal
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
