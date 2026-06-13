"use client";

import { useEffect, useState } from "react";
import { Award, BookOpen, CheckCircle2, AlertCircle, Users, TrendingUp } from "lucide-react";
import { Header } from "@/components/layout/header";

interface GradeComponent {
  id: string;
  name: string;
  percentage: number;
  score: number | null;
  weighted: number | null;
}

interface MyGrade {
  matrixId: string;
  matrixTitle: string;
  description: string | null;
  group: { id: string; name: string; code: string } | null;
  dosenName: string | null;
  studentName: string;
  studentNim: string | null;
  components: GradeComponent[];
  totalPercentage: number;
  finalGrade: number | null;
  updatedAt: string;
}

function gradeLabel(score: number) {
  if (score >= 85) return { letter: "A", color: "text-emerald-600", bg: "bg-emerald-500/10" };
  if (score >= 75) return { letter: "B", color: "text-blue-600", bg: "bg-blue-500/10" };
  if (score >= 60) return { letter: "C", color: "text-amber-600", bg: "bg-amber-500/10" };
  if (score >= 40) return { letter: "D", color: "text-orange-600", bg: "bg-orange-500/10" };
  return { letter: "E", color: "text-red-600", bg: "bg-red-500/10" };
}

function scoreColor(score: number | null) {
  if (score === null) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function GradeCard({ grade }: { grade: MyGrade }) {
  const filledCount = grade.components.filter((c) => c.score !== null).length;
  const g = grade.finalGrade !== null ? gradeLabel(grade.finalGrade) : null;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Card Header */}
      <div className="p-5 border-b flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate">{grade.matrixTitle}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {grade.group && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {grade.group.name}
              </span>
            )}
            {grade.dosenName && (
              <span className="text-xs text-muted-foreground">· {grade.dosenName}</span>
            )}
            <span className="text-xs text-muted-foreground">· Diperbarui {formatDate(grade.updatedAt)}</span>
          </div>
        </div>

        {/* Final Grade Badge */}
        {grade.finalGrade !== null && g ? (
          <div className={`flex flex-col items-center justify-center rounded-xl px-4 py-2.5 shrink-0 ${g.bg}`}>
            <span className={`text-2xl font-bold leading-none ${g.color}`}>{g.letter}</span>
            <span className={`text-xs font-semibold mt-0.5 ${g.color}`}>{grade.finalGrade}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl px-4 py-2.5 shrink-0 bg-muted/40">
            <span className="text-xs text-muted-foreground font-medium">Belum</span>
            <span className="text-xs text-muted-foreground">dinilai</span>
          </div>
        )}
      </div>

      {/* Components Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Komponen
              </th>
              <th className="px-5 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Bobot
              </th>
              <th className="px-5 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Nilai
              </th>
              <th className="px-5 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Nilai Terbobot
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {grade.components.map((c) => (
              <tr key={c.id} className="hover:bg-accent/20 transition-colors">
                <td className="px-5 py-3 text-sm font-medium">{c.name}</td>
                <td className="px-5 py-3 text-center text-sm text-muted-foreground">{c.percentage}%</td>
                <td className="px-5 py-3 text-center">
                  {c.score !== null ? (
                    <span className={`text-sm font-bold ${scoreColor(c.score)}`}>{c.score}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground/60">–</span>
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  {c.weighted !== null ? (
                    <span className={`text-sm font-semibold ${scoreColor(c.score)}`}>
                      {Math.round(c.weighted * 10) / 10}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/60">–</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/20">
              <td className="px-5 py-3 text-sm font-semibold">Total</td>
              <td className="px-5 py-3 text-center text-sm font-semibold">{grade.totalPercentage}%</td>
              <td className="px-5 py-3 text-center">
                <span className="text-[11px] text-muted-foreground">
                  {filledCount}/{grade.components.length} diisi
                </span>
              </td>
              <td className="px-5 py-3 text-center">
                {grade.finalGrade !== null ? (
                  <span className={`text-sm font-bold ${scoreColor(grade.finalGrade)}`}>
                    {grade.finalGrade}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/60">–</span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Status Bar */}
      <div className="px-5 py-3 bg-muted/10 border-t flex items-center gap-2">
        {filledCount === grade.components.length ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        )}
        <span className="text-xs text-muted-foreground">
          {filledCount === grade.components.length
            ? "Semua komponen sudah dinilai"
            : `${grade.components.length - filledCount} komponen belum dinilai`}
        </span>
      </div>
    </div>
  );
}

export default function NilaiPage() {
  const [grades, setGrades] = useState<MyGrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/grade-matrix/my-grades")
      .then((r) => r.json())
      .then((d) => setGrades(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Header title="Nilai Saya" description="Rekap penilaian dari dosen" />
        <div className="p-6 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card rounded-2xl h-48 animate-pulse bg-muted/30" />
          ))}
        </div>
      </>
    );
  }

  if (grades.length === 0) {
    return (
      <>
        <Header title="Nilai Saya" description="Rekap penilaian dari dosen" />
        <div className="p-6">
          <div className="glass-card rounded-2xl p-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Belum Ada Nilai</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Nilai Anda belum tersedia. Pastikan NIM Anda sudah terdaftar dan dosen sudah mengisi nilai di matrik penilaian.
            </p>
          </div>
        </div>
      </>
    );
  }

  const latestGrade = grades.find((g) => g.finalGrade !== null);
  const avgFinal =
    grades.filter((g) => g.finalGrade !== null).length > 0
      ? Math.round(
          (grades.filter((g) => g.finalGrade !== null).reduce((s, g) => s + g.finalGrade!, 0) /
            grades.filter((g) => g.finalGrade !== null).length) *
            10
        ) / 10
      : null;

  return (
    <>
      <Header title="Nilai Saya" description="Rekap penilaian dari dosen" />
      <div className="p-6 space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Matrik</p>
              <p className="text-2xl font-bold">{grades.length}</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${avgFinal !== null ? (avgFinal >= 60 ? "bg-emerald-500/10" : "bg-amber-500/10") : "bg-muted/40"}`}>
              <TrendingUp className={`h-5 w-5 ${avgFinal !== null ? (avgFinal >= 60 ? "text-emerald-600" : "text-amber-600") : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Rata-rata Nilai Akhir</p>
              <p className={`text-2xl font-bold ${avgFinal !== null ? (avgFinal >= 60 ? "text-emerald-600" : "text-amber-600") : ""}`}>
                {avgFinal !== null ? avgFinal : "–"}
              </p>
            </div>
          </div>

          {latestGrade?.finalGrade != null && (
            <div className="glass-card rounded-2xl p-5 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${gradeLabel(latestGrade.finalGrade).bg}`}>
                <Award className={`h-5 w-5 ${gradeLabel(latestGrade.finalGrade).color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Nilai Huruf Terbaru</p>
                <p className={`text-2xl font-bold ${gradeLabel(latestGrade.finalGrade).color}`}>
                  {gradeLabel(latestGrade.finalGrade).letter}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Grade Cards */}
        <div className="space-y-4">
          {grades.map((grade) => (
            <GradeCard key={grade.matrixId} grade={grade} />
          ))}
        </div>
      </div>
    </>
  );
}
