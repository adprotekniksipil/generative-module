"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import {
  Plus, Trash2, Save, ArrowLeft, AlertCircle, CheckCircle2,
  UserPlus, Settings2, Download, FileSpreadsheet, FileText, ChevronDown,
} from "lucide-react";
import { exportGradeMatrixPdf, exportGradeMatrixXlsx, type ExportGradeScale } from "@/lib/export/grade-matrix-export";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GradeScaleItem { letter: string; min: number }

interface Component { name: string; percentage: number; order: number }
interface StudentRow {
  name: string;
  nim: string;
  order: number;
  scores: (number | null)[];
}

interface MatrixState {
  title: string;
  description: string;
  group: { id: string; name: string; code: string } | null;
  components: Component[];
  students: StudentRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_SCALE: GradeScaleItem[] = [
  { letter: "A", min: 80 }, { letter: "AB", min: 75 }, { letter: "B", min: 70 },
  { letter: "BC", min: 65 }, { letter: "C", min: 60 }, { letter: "D", min: 55 },
  { letter: "E", min: 0 },
];

function calcFinalScore(scores: (number | null)[], components: Component[]): number | null {
  if (components.length === 0) return null;
  let total = 0;
  let weightUsed = 0;
  for (let i = 0; i < components.length; i++) {
    const s = scores[i];
    if (s !== null && s !== undefined) {
      total += s * (components[i].percentage / 100);
      weightUsed += components[i].percentage;
    }
  }
  if (weightUsed === 0) return null;
  return Math.round((total / weightUsed) * weightUsed * 10) / 10;
}

function calcWeightedScore(scores: (number | null)[], components: Component[]): number {
  let total = 0;
  for (let i = 0; i < components.length; i++) {
    const s = scores[i] ?? 0;
    total += s * (components[i].percentage / 100);
  }
  return Math.round(total * 10) / 10;
}

function letterGrade(score: number | null, scale: GradeScaleItem[]): string {
  if (score === null) return "–";
  const sorted = [...scale].sort((a, b) => b.min - a.min);
  return sorted.find((s) => score >= s.min)?.letter ?? "E";
}

function gradeColor(letter: string): string {
  if (letter === "A") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (letter === "AB") return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
  if (letter === "B") return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
  if (letter === "BC") return "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300";
  if (letter === "C") return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  if (letter === "D") return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
  if (letter === "E" || letter === "–") return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  return "bg-muted text-muted-foreground";
}

// ─── Editable cell ────────────────────────────────────────────────────────────

function ScoreCell({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setRaw(value !== null ? String(value) : "");
    setEditing(true);
    setTimeout(() => ref.current?.select(), 0);
  };

  const commit = () => {
    const n = parseFloat(raw);
    if (raw.trim() === "" || isNaN(n)) onChange(null);
    else onChange(Math.min(100, Math.max(0, n)));
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        min={0}
        max={100}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className="w-full h-full text-center text-sm font-semibold bg-primary/10 border-2 border-primary rounded focus:outline-none"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={startEdit}
      className="w-full h-full flex items-center justify-center text-sm font-semibold hover:bg-accent/60 rounded transition-colors group"
    >
      {value !== null ? (
        <span>{value}</span>
      ) : (
        <span className="text-muted-foreground/30 group-hover:text-muted-foreground text-xs">–</span>
      )}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GradeMatrixEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [matrix, setMatrix] = useState<MatrixState | null>(null);
  const [scale, setScale] = useState<GradeScaleItem[]>(DEFAULT_SCALE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [mRes, sRes] = await Promise.all([
      fetch(`/api/grade-matrix/${id}`),
      fetch("/api/settings/grade-scale"),
    ]);
    if (!mRes.ok) { router.push("/grade-matrix"); return; }
    const m = await mRes.json();
    const s = sRes.ok ? await sRes.json() : DEFAULT_SCALE;
    setMatrix({
      title: m.title,
      description: m.description ?? "",
      group: m.group ?? null,
      components: m.components,
      students: m.students,
    });
    setScale(s);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!matrix) return;
    const totalPct = matrix.components.reduce((s, c) => s + c.percentage, 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      setError(`Total persentase harus 100% (saat ini ${totalPct}%)`);
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/grade-matrix/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: matrix.title,
        description: matrix.description,
        components: matrix.components.map((c, i) => ({ ...c, order: i })),
        students: matrix.students.map((s, i) => ({ ...s, order: i })),
      }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    else setError("Gagal menyimpan");
  };

  // ── Component mutations ──────────────────────────────────────────────────

  const addComponent = () => {
    setMatrix((m) => m ? {
      ...m,
      components: [...m.components, { name: "Komponen Baru", percentage: 0, order: m.components.length }],
      students: m.students.map((s) => ({ ...s, scores: [...s.scores, null] })),
    } : m);
  };

  const removeComponent = (idx: number) => {
    setMatrix((m) => m ? {
      ...m,
      components: m.components.filter((_, i) => i !== idx),
      students: m.students.map((s) => ({ ...s, scores: s.scores.filter((_, i) => i !== idx) })),
    } : m);
  };

  const updateComponent = (idx: number, field: keyof Component, val: string | number) => {
    setMatrix((m) => m ? {
      ...m,
      components: m.components.map((c, i) => i === idx ? { ...c, [field]: val } : c),
    } : m);
  };

  // ── Student mutations ────────────────────────────────────────────────────

  const addStudent = () => {
    setMatrix((m) => m ? {
      ...m,
      students: [...m.students, {
        name: "",
        nim: "",
        order: m.students.length,
        scores: m.components.map(() => null),
      }],
    } : m);
  };

  const removeStudent = (idx: number) => {
    setMatrix((m) => m ? { ...m, students: m.students.filter((_, i) => i !== idx) } : m);
  };

  const updateStudent = (idx: number, field: "name" | "nim", val: string) => {
    setMatrix((m) => m ? {
      ...m,
      students: m.students.map((s, i) => i === idx ? { ...s, [field]: val } : s),
    } : m);
  };

  const updateScore = (studentIdx: number, compIdx: number, val: number | null) => {
    setMatrix((m) => m ? {
      ...m,
      students: m.students.map((s, i) =>
        i === studentIdx
          ? { ...s, scores: s.scores.map((sc, j) => j === compIdx ? val : sc) }
          : s
      ),
    } : m);
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (loading || !matrix) {
    return (
      <>
        <Header title="Matriks Nilai" description="Memuat..." />
        <div className="p-6">
          <div className="glass-card rounded-2xl h-96 animate-pulse bg-muted/30" />
        </div>
      </>
    );
  }

  const buildExportData = () => ({
    title: matrix.title,
    groupName: matrix.group ? `${matrix.group.name} (${matrix.group.code})` : undefined,
    components: matrix.components,
    students: matrix.students,
    scale: scale as ExportGradeScale[],
  });

  const handleExportPdf = () => { setExportOpen(false); exportGradeMatrixPdf(buildExportData()); };
  const handleExportXlsx = () => { setExportOpen(false); exportGradeMatrixXlsx(buildExportData()); };

  const totalPct = matrix.components.reduce((s, c) => s + c.percentage, 0);
  const pctOk = Math.abs(totalPct - 100) < 0.01;

  return (
    <>
      <Header
        title={matrix.title}
        description={matrix.group ? `Kelas: ${matrix.group.name} (${matrix.group.code}) — Klik sel untuk mengedit nilai` : "Klik sel untuk mengedit nilai. Simpan setelah selesai."}
      />

      <div className="p-6 space-y-5">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/grade-matrix"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <div className="flex items-center gap-2">
            {error && (
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> {error}
              </span>
            )}
            {saved && (
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Tersimpan
              </span>
            )}
            <Link
              href="/settings/grade-scale"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border hover:bg-accent transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5" /> Skala Nilai
            </Link>

            {/* Export dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border hover:bg-accent transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Ekspor
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-50 w-44 rounded-xl border bg-background shadow-xl py-1.5">
                    <button
                      onClick={handleExportPdf}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      <div className="h-6 w-6 rounded-md bg-red-50 flex items-center justify-center shrink-0">
                        <FileText className="h-3.5 w-3.5 text-red-500" />
                      </div>
                      Ekspor PDF
                    </button>
                    <button
                      onClick={handleExportXlsx}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      <div className="h-6 w-6 rounded-md bg-green-50 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      Ekspor Excel
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>

        {/* Percentage warning */}
        {!pctOk && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Total persentase: <strong className="ml-1">{totalPct}%</strong>
            <span className="ml-1 text-amber-600/70">(harus tepat 100%)</span>
          </div>
        )}

        {/* Matrix table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: `${200 + matrix.components.length * 100 + 100}px` }}>
              <thead>
                {/* Component name row */}
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-10">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground min-w-[140px]">Nama Mahasiswa</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-28">NIM</th>
                  {matrix.components.map((c, ci) => (
                    <th key={ci} className="px-2 py-2 text-center w-24 group">
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => updateComponent(ci, "name", e.target.value)}
                          className="text-xs font-semibold text-center bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none w-full transition-colors"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={c.percentage}
                            onChange={(e) => updateComponent(ci, "percentage", parseFloat(e.target.value) || 0)}
                            className="text-[11px] text-center text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none w-10 transition-colors"
                          />
                          <span className="text-[11px] text-muted-foreground">%</span>
                          <button
                            onClick={() => removeComponent(ci)}
                            className="opacity-0 group-hover:opacity-100 text-destructive/70 hover:text-destructive transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                  {/* Add component */}
                  <th className="px-2 py-2 w-10">
                    <button
                      onClick={addComponent}
                      className="flex items-center justify-center h-8 w-8 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:text-primary transition-colors text-muted-foreground/50 mx-auto"
                      title="Tambah komponen"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground w-16">Nilai</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40">
                {matrix.students.map((s, si) => {
                  const weighted = calcWeightedScore(s.scores, matrix.components);
                  const letter = letterGrade(weighted, scale);
                  return (
                    <tr key={si} className="hover:bg-accent/20 transition-colors group">
                      <td className="px-4 py-2 text-xs text-muted-foreground font-mono">{si + 1}</td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={s.name}
                          onChange={(e) => updateStudent(si, "name", e.target.value)}
                          placeholder="Nama mahasiswa"
                          className="text-sm bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none w-full transition-colors"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={s.nim ?? ""}
                          onChange={(e) => updateStudent(si, "nim", e.target.value)}
                          placeholder="NIM"
                          className="text-xs font-mono bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none w-full transition-colors"
                        />
                      </td>
                      {matrix.components.map((_, ci) => (
                        <td key={ci} className="px-1 py-1 h-10 w-24">
                          <ScoreCell
                            value={s.scores[ci] ?? null}
                            onChange={(v) => updateScore(si, ci, v)}
                          />
                        </td>
                      ))}
                      <td className="px-1 py-1">
                        {/* empty column for add-component button alignment */}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {s.scores.some((sc) => sc !== null) ? (
                          <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-lg text-xs font-bold ${gradeColor(letter)}`}>
                            {letter}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">–</span>
                        )}
                      </td>
                      <td className="py-2 pr-2 w-8">
                        <button
                          onClick={() => removeStudent(si)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Add student row */}
                <tr>
                  <td colSpan={matrix.components.length + 5} className="px-4 py-2">
                    <button
                      onClick={addStudent}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <UserPlus className="h-4 w-4" />
                      Tambah mahasiswa
                    </button>
                  </td>
                </tr>
              </tbody>

              {/* Footer: totals */}
              {matrix.students.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/20">
                    <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                      Rata-rata kelas
                    </td>
                    {matrix.components.map((_, ci) => {
                      const vals = matrix.students.map((s) => s.scores[ci]).filter((v): v is number => v !== null);
                      const avg = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
                      return (
                        <td key={ci} className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground">
                          {avg !== null ? avg : "–"}
                        </td>
                      );
                    })}
                    <td />
                    <td className="px-4 py-2 text-center">
                      {(() => {
                        const finals = matrix.students
                          .filter((s) => s.scores.some((sc) => sc !== null))
                          .map((s) => calcWeightedScore(s.scores, matrix.components));
                        if (finals.length === 0) return <span className="text-xs text-muted-foreground">–</span>;
                        const avg = Math.round((finals.reduce((a, b) => a + b, 0) / finals.length) * 10) / 10;
                        const letter = letterGrade(avg, scale);
                        return (
                          <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-lg text-xs font-bold ${gradeColor(letter)}`}>
                            {letter}
                          </span>
                        );
                      })()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Grade scale reference */}
        <div className="glass-card rounded-2xl p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Skala Nilai yang Digunakan
          </h4>
          <div className="flex flex-wrap gap-2">
            {[...scale].sort((a, b) => b.min - a.min).map((s, i, arr) => {
              const max = i === 0 ? 100 : arr[i - 1].min - 1;
              return (
                <div key={s.letter} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${gradeColor(s.letter)}`}>
                  <span>{s.letter}</span>
                  <span className="opacity-60">·</span>
                  <span>{s.min}–{max}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
