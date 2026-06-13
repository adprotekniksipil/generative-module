"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  Sparkles,
  FileText,
  ChevronRight,
  Calendar,
  Users,
  FolderOpen,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { 
  HeroDosenIllustration, StatMaterialIcon, StatQuizIcon, StatClassIcon, StatStudentIcon,
  ActionMaterialArt, ActionQuizArt, ActionClassArt
} from "@/components/ui/illustrations";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  materialCount: number;
  quizCount: number;
  groupCount: number;
  studentCount: number;
  pendingGrading: number;
  recentMaterials: Array<{
    id: string;
    title: string;
    topic: string;
    subTopic: string;
    createdAt: string;
    difficulty: string;
    isPublished: boolean;
  }>;
  recentQuizzes: Array<{
    id: string;
    title: string;
    topic: string;
    questionCount: number;
    createdAt: string;
    isPublished: boolean;
  }>;
}

const quickActions = [
  {
    title: "Buat Materi",
    description: "Generate modul pembelajaran dari topik",
    href: "/materials/new",
    icon: BookOpen,
    color: "text-blue-600",
    iconBg: "bg-blue-500/10",
    illustration: "/illustrations/dashboard/action-buat-materi-v2.png",
    bgClass: "bg-[#1A4B59]",
    art: ActionMaterialArt,
  },
  {
    title: "Buat Soal Ujian",
    description: "Generate soal PG, esai, atau campuran",
    href: "/quizzes/new",
    icon: ClipboardList,
    color: "text-violet-600",
    iconBg: "bg-violet-500/10",
    illustration: "/illustrations/dashboard/action-buat-soal.png",
    bgClass: "bg-[#256877]",
    art: ActionQuizArt,
  },
  {
    title: "Kelola Kelas",
    description: "Buat kelas dan tambah mahasiswa",
    href: "/groups",
    icon: FolderOpen,
    color: "text-emerald-600",
    iconBg: "bg-emerald-500/10",
    illustration: "/illustrations/dashboard/action-kelola-kelas.png",
    bgClass: "bg-[#32778A]",
    art: ActionClassArt,
  },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    materialCount: 0,
    quizCount: 0,
    groupCount: 0,
    studentCount: 0,
    pendingGrading: 0,
    recentMaterials: [],
    recentQuizzes: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [matRes, quizRes, groupRes, userRes, gradingRes] = await Promise.all([
          fetch("/api/materials"),
          fetch("/api/quizzes"),
          fetch("/api/groups"),
          fetch("/api/users?role=MAHASISWA"),
          fetch("/api/quizzes/pending-grading"),
        ]);
        const materials = await matRes.json();
        const quizzes = await quizRes.json();
        const groups = groupRes.ok ? await groupRes.json() : [];
        const students = userRes.ok ? await userRes.json() : [];
        const pendingData = gradingRes.ok ? await gradingRes.json() : { count: 0 };

        setStats({
          materialCount: materials?.length ?? 0,
          quizCount: quizzes?.length ?? 0,
          groupCount: groups?.length ?? 0,
          studentCount: students?.length ?? 0,
          pendingGrading: pendingData.count ?? 0,
          recentMaterials: (materials ?? []).slice(0, 3),
          recentQuizzes: (quizzes ?? []).slice(0, 3),
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
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-3xl bg-[#1d5b6b] p-6 md:p-8 text-white shadow-sm border border-[#2b7182]">
          <div className="relative z-10 max-w-lg">
            <h2 className="text-xl md:text-2xl font-bold mb-2">
              Selamat Datang di Portal Teknik Sipil
            </h2>
            <p className="text-sm text-teal-50/90 leading-relaxed font-light">
              Akses, kelola, dan analisis materi serta soal ujian untuk modul Teknik
              Sipil dengan mudah. Silakan pilih menu di bawah untuk memulai.
            </p>
          </div>
          {/* Hero Illustration */}
          <HeroDosenIllustration />
          {/* AI Badge */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 hidden lg:flex items-center gap-1.5 rounded-full bg-white/95 text-slate-800 px-3 py-1.5 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-semibold">Powered by Gemini AI</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-[2rem] p-4 sm:p-5 relative overflow-hidden bg-white/90 shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                  <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <h3 className="text-[13px] font-semibold text-slate-800">Materi Aktif</h3>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1 leading-none">
                {loading ? "..." : stats.materialCount}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-emerald-600">
                <TrendingUp className="h-3 w-3" /> Modul pembelajaran
              </div>
              <div className="w-24 h-1.5 rounded-full bg-slate-100 mt-2">
                <div className="w-[65%] h-full bg-emerald-500 rounded-full" />
              </div>
            </div>
            <div className="shrink-0 relative w-12 h-12 flex items-center justify-center">
              <StatMaterialIcon className="w-12 h-12" />
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-4 sm:p-5 relative overflow-hidden bg-white/90 shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                  <ClipboardList className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <h3 className="text-[13px] font-semibold text-slate-800 tracking-tight">Bank Soal & Kasus</h3>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1 leading-none">
                {loading ? "..." : stats.quizCount}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-emerald-600">
                <TrendingUp className="h-3 w-3" /> Bank soal ujian
              </div>
              <div className="w-24 h-1.5 rounded-full bg-slate-100 mt-2">
                <div className="w-[40%] h-full bg-blue-500 rounded-full" />
              </div>
            </div>
            <div className="shrink-0 relative w-12 h-12 flex items-center justify-center">
              <StatQuizIcon className="w-12 h-12" />
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-4 sm:p-5 relative overflow-hidden bg-white/90 shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                  <FolderOpen className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <h3 className="text-[13px] font-semibold text-slate-800">Kelas Aktif</h3>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1 leading-none">
                {loading ? "..." : stats.groupCount}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-emerald-600">
                <TrendingUp className="h-3 w-3" /> Manajemen kelas
              </div>
              <div className="w-24 h-1.5 rounded-full bg-slate-100 mt-2">
                <div className="w-[80%] h-full bg-emerald-500 rounded-full" />
              </div>
            </div>
            <div className="shrink-0 relative w-12 h-12 flex items-center justify-center">
              <StatClassIcon className="w-12 h-12" />
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-4 sm:p-5 relative overflow-hidden bg-white/90 shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                  <Users className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <h3 className="text-[13px] font-semibold text-slate-800">Total Mahasiswa</h3>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1 leading-none">
                {loading ? "..." : stats.studentCount}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-amber-600">
                <Users className="h-3 w-3" /> Pengguna terdaftar
              </div>
              <div className="w-24 h-1.5 rounded-full bg-slate-100 mt-2">
                <div className="w-[95%] h-full bg-amber-500 rounded-full" />
              </div>
            </div>
            <div className="shrink-0 relative w-12 h-12 flex items-center justify-center">
              <StatStudentIcon className="w-12 h-12" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Cards */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                Aksi Cepat
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {quickActions.map((action) => (
                  <Link key={action.href} href={action.href}>
                    <div className={`relative overflow-hidden rounded-[1.5rem] ${action.bgClass} p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group h-full min-h-[140px] text-white flex flex-col justify-between border border-transparent hover:border-white/10`}>
                      {/* Decorative Art Background */}
                      {action.art && <action.art />}
                      {/* Content */}
                      <div className="relative z-10 w-full mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-md mb-3 ring-1 ring-white/20">
                          <action.icon className="h-5 w-5 text-teal-50" />
                        </div>
                      </div>
                      <div className="relative z-10">
                        <h4 className="text-[15px] font-bold mb-1 tracking-tight">
                          {action.title}
                        </h4>
                        <p className="text-[12px] text-teal-50/80 leading-snug font-medium max-w-[85%]">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Materials */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Materi Terbaru
                </h3>
                <Link
                  href="/materials"
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                >
                  Lihat Semua <ChevronRight className="h-3 w-3" />
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
                      Belum ada materi. Mulai buat materi pertama!
                    </p>
                  </div>
                ) : (
                  stats.recentMaterials.map((mat) => (
                    <Link
                      key={mat.id}
                      href={`/materials/${mat.id}`}
                      className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium line-clamp-1">{mat.title}</p>
                            {!mat.isPublished && (
                              <Badge variant="outline" className="rounded-md text-[10px] px-1.5 py-0">
                                Draft
                              </Badge>
                            )}
                          </div>
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
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Pending Grading Alert */}
            {stats.pendingGrading > 0 && (
              <Link href="/quizzes" className="block">
                <div className="glass-card rounded-2xl p-4 border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 shrink-0">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-800 mb-0.5">Perlu Penilaian</p>
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        {stats.pendingGrading} kuis memiliki soal esai yang mungkin perlu dinilai manual.
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Recent Quizzes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Soal Terbaru
                </h3>
                <Link
                  href="/quizzes"
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                >
                  Lihat <ChevronRight className="h-3 w-3" />
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
                      Belum ada soal.
                    </p>
                  </div>
                ) : (
                  stats.recentQuizzes.map((quiz) => (
                    <Link
                      key={quiz.id}
                      href={`/quizzes/${quiz.id}`}
                      className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                        <ClipboardList className="h-4 w-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium line-clamp-1">{quiz.title}</p>
                          {!quiz.isPublished && (
                            <Badge variant="outline" className="rounded-md text-[10px] px-1.5 py-0">
                              Draft
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {quiz.questionCount} soal
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Quick Tip */}
            <div className="glass-card rounded-2xl p-4 border-primary/10 bg-primary/[0.03]">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Tips</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Soal esai dapat dinilai secara manual atau dengan bantuan AI.
                    Buka detail kuis dan pilih tab &quot;Hasil & Penilaian&quot;.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
