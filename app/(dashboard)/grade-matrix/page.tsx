"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { TableProperties, Plus, Trash2, ChevronRight, AlertCircle, Users, Filter } from "lucide-react";

interface Group { id: string; name: string; code: string }

interface MatrixSummary {
  id: string;
  title: string;
  description: string | null;
  group: Group | null;
  componentCount: number;
  studentCount: number;
  totalPercentage: number;
  updatedAt: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function GradeMatrixListPage() {
  const router = useRouter();
  const [matrices, setMatrices] = useState<MatrixSummary[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterGroupId, setFilterGroupId] = useState("");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formGroupId, setFormGroupId] = useState("");

  const load = (gid?: string) => {
    setLoading(true);
    const url = gid ? `/api/grade-matrix?groupId=${gid}` : "/api/grade-matrix";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setMatrices(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetch("/api/groups")
      .then((r) => r.json())
      .then((d) => setGroups(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const handleFilterChange = (gid: string) => {
    setFilterGroupId(gid);
    load(gid || undefined);
  };

  const handleCreate = async () => {
    if (!formTitle.trim() || !formGroupId) return;
    setCreating(true);
    const res = await fetch("/api/grade-matrix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: formTitle, groupId: formGroupId }),
    });
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/grade-matrix/${id}`);
    }
    setCreating(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Hapus matriks nilai ini?")) return;
    setDeletingId(id);
    await fetch(`/api/grade-matrix/${id}`, { method: "DELETE" });
    setMatrices((prev) => prev.filter((m) => m.id !== id));
    setDeletingId(null);
  };

  return (
    <>
      <Header
        title="Matriks Nilai"
        description="Input dan hitung nilai akhir mahasiswa per kelas"
      />
      <div className="p-6 space-y-5">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Kelas:</span>
            <select
              value={filterGroupId}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="text-sm rounded-lg border bg-muted/40 px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
            >
              <option value="">Semua Kelas</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.code})</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Buat Matriks Baru
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold">Buat Matriks Nilai Baru</h3>
            <div className="space-y-3">
              {/* Pilih kelas */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Pilih Kelas *</label>
                {groups.length === 0 ? (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Belum ada kelas. Buat kelas di menu Kelola Kelas terlebih dahulu.
                  </p>
                ) : (
                  <select
                    value={formGroupId}
                    onChange={(e) => setFormGroupId(e.target.value)}
                    className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">— Pilih kelas —</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Judul matriks */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nama Matriks *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Contoh: Nilai Mekanika Tanah — Ganjil 2024/2025"
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {formGroupId && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Mahasiswa dari kelas ini akan otomatis ditambahkan sebagai baris.
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCreate}
                  disabled={creating || !formTitle.trim() || !formGroupId}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {creating ? "Membuat..." : "Buat & Buka"}
                </button>
                <button
                  onClick={() => { setShowForm(false); setFormTitle(""); setFormGroupId(""); }}
                  className="px-4 py-2.5 rounded-xl border text-sm hover:bg-accent transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl h-20 animate-pulse bg-muted/30" />
            ))}
          </div>
        ) : matrices.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <TableProperties className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-semibold mb-2">Belum Ada Matriks Nilai</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Buat matriks nilai untuk kelas dan mulai input nilai mahasiswa.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {matrices.map((m) => (
              <div
                key={m.id}
                className="glass-card rounded-2xl px-5 py-4 flex items-center gap-4 hover:bg-accent/30 transition-colors cursor-pointer group"
                onClick={() => router.push(`/grade-matrix/${m.id}`)}
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <TableProperties className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{m.title}</p>
                    {m.group && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                        <Users className="h-3 w-3" />
                        {m.group.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">{m.componentCount} komponen</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground">{m.studentCount} mahasiswa</span>
                    <span className="text-muted-foreground/40">·</span>
                    {m.totalPercentage !== 100 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                        <AlertCircle className="h-3 w-3" />
                        Total {m.totalPercentage}%
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-600 font-medium">Total 100%</span>
                    )}
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground">{formatDate(m.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleDelete(e, m.id)}
                    disabled={deletingId === m.id}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
