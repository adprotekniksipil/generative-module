"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Plus, Trash2, Save, RotateCcw, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface GradeScaleItem { letter: string; min: number }

const DEFAULT_SCALE: GradeScaleItem[] = [
  { letter: "A",  min: 80 },
  { letter: "AB", min: 75 },
  { letter: "B",  min: 70 },
  { letter: "BC", min: 65 },
  { letter: "C",  min: 60 },
  { letter: "D",  min: 55 },
  { letter: "E",  min: 0  },
];

function gradeColor(letter: string): string {
  if (letter === "A")  return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (letter === "AB") return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
  if (letter === "B")  return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
  if (letter === "BC") return "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300";
  if (letter === "C")  return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  if (letter === "D")  return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
  return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
}

export default function GradeScaleSettingsPage() {
  const [scale, setScale] = useState<GradeScaleItem[]>(DEFAULT_SCALE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings/grade-scale")
      .then((r) => r.json())
      .then((d) => setScale(Array.isArray(d) ? d : DEFAULT_SCALE))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...scale].sort((a, b) => b.min - a.min);

  const validate = (): string => {
    if (scale.length < 2) return "Minimal 2 skala nilai";
    const letters = scale.map((s) => s.letter.trim());
    if (letters.some((l) => !l)) return "Semua huruf nilai wajib diisi";
    if (new Set(letters).size !== letters.length) return "Huruf nilai tidak boleh duplikat";
    const mins = scale.map((s) => s.min);
    if (new Set(mins).size !== mins.length) return "Nilai minimum tidak boleh duplikat";
    if (mins.some((m) => m < 0 || m > 100)) return "Nilai minimum harus antara 0–100";
    if (!mins.includes(0)) return "Harus ada satu skala dengan nilai minimum 0";
    return "";
  };

  const save = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/settings/grade-scale", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scale),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    else setError("Gagal menyimpan");
  };

  const updateRow = (idx: number, field: keyof GradeScaleItem, val: string | number) => {
    // idx is in sorted order; find original index
    const original = scale.indexOf(sorted[idx]);
    setScale((prev) => prev.map((s, i) => i === original ? { ...s, [field]: val } : s));
  };

  const addRow = () => {
    setScale((prev) => [...prev, { letter: "", min: 50 }]);
  };

  const removeRow = (idx: number) => {
    const original = scale.indexOf(sorted[idx]);
    setScale((prev) => prev.filter((_, i) => i !== original));
  };

  return (
    <>
      <Header title="Pengaturan Skala Nilai" description="Konfigurasi konversi nilai angka ke huruf" />
      <div className="p-6 max-w-2xl space-y-5">

        <div className="flex items-center justify-between gap-3">
          <Link
            href="/grade-matrix"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Matriks Nilai
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
            <button
              onClick={() => { setScale(DEFAULT_SCALE); setError(""); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border hover:bg-accent transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Default
            </button>
            <button
              onClick={save}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b bg-muted/30">
            <p className="text-sm font-semibold">Tabel Skala Nilai</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Nilai akhir mahasiswa dikonversi berdasarkan rentang di bawah. Harus ada satu skala dengan minimum 0.
            </p>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[80px_1fr_1fr_40px] gap-2 px-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Huruf</span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Min. Nilai</span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Rentang</span>
                <span />
              </div>

              {sorted.map((item, i) => {
                const max = i === 0 ? 100 : sorted[i - 1].min - 1;
                return (
                  <div key={i} className="grid grid-cols-[80px_1fr_1fr_40px] gap-2 items-center p-2 rounded-xl hover:bg-muted/30 transition-colors group">
                    <div className="flex justify-center">
                      <input
                        type="text"
                        value={item.letter}
                        onChange={(e) => updateRow(i, "letter", e.target.value.toUpperCase())}
                        maxLength={3}
                        className={`w-14 text-center text-sm font-bold rounded-lg px-2 py-1.5 border focus:outline-none focus:ring-2 focus:ring-primary/30 ${gradeColor(item.letter)}`}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={item.min}
                        onChange={(e) => updateRow(i, "min", parseInt(e.target.value) || 0)}
                        className="w-20 text-center text-sm font-semibold rounded-lg border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-sm text-muted-foreground font-mono">
                        {item.min} – {max}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => removeRow(i)}
                        disabled={scale.length <= 2}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:hidden"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={addRow}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 text-sm text-muted-foreground hover:text-primary transition-colors mt-2"
              >
                <Plus className="h-4 w-4" /> Tambah skala nilai
              </button>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="glass-card rounded-2xl p-5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Preview</h4>
          <div className="flex flex-wrap gap-2">
            {sorted.map((s, i) => {
              const max = i === 0 ? 100 : sorted[i - 1].min - 1;
              return (
                <div key={s.letter} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${gradeColor(s.letter)}`}>
                  {s.letter || "?"} <span className="opacity-50 font-normal">({s.min}–{max})</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
