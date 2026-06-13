"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import { PlusCircle, Users, Copy, Trash2, FolderOpen, Eye, Calendar } from "lucide-react";

interface Group {
  id: string;
  name: string;
  description: string | null;
  code: string;
  createdAt: string;
  _count: { members: number };
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) setGroups(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc || null }),
      });
      if (res.ok) {
        toast.success("Kelas berhasil dibuat");
        setNewName("");
        setNewDesc("");
        setShowCreate(false);
        fetchGroups();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kelas ini? Semua anggota akan dikeluarkan.")) return;
    const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Kelas dihapus");
      setGroups((g) => g.filter((x) => x.id !== id));
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Kode "${code}" disalin`);
  };

  return (
    <div className="flex flex-col">
      <Header
        title="Kelola Kelas"
        description="Buat dan kelola kelas/grup mahasiswa"
      />
      <div className="p-6 space-y-4">
        {/* Header area */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? "Memuat..." : `${groups.length} kelas tersimpan`}
          </p>
          <Button
            className="rounded-xl gap-1.5"
            onClick={() => setShowCreate(!showCreate)}
          >
            <PlusCircle className="h-4 w-4" /> Buat Kelas
          </Button>
        </div>

        {/* Form buat kelas */}
        {showCreate && (
          <form onSubmit={handleCreate} className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-sm">Kelas Baru</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nama Kelas <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Contoh: Mekanika Struktur - Kelas A"
                required
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deskripsi (opsional)</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Keterangan singkat tentang kelas"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="rounded-xl gap-1.5" disabled={creating}>
                {creating ? "Membuat..." : "Buat Kelas"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => setShowCreate(false)}
              >
                Batal
              </Button>
            </div>
          </form>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          /* Empty state */
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center text-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <FolderOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">Belum ada kelas</h3>
            <p className="text-sm text-muted-foreground">
              Buat kelas pertama untuk mulai mengelola mahasiswa
            </p>
            <Button
              className="rounded-xl gap-1.5 mt-1"
              onClick={() => setShowCreate(true)}
            >
              <PlusCircle className="h-4 w-4" /> Buat Kelas Pertama
            </Button>
          </div>
        ) : (
          /* Group list */
          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-sm truncate">{group.name}</h3>
                    <Badge
                      variant="secondary"
                      className="font-mono text-[11px] rounded-lg cursor-pointer gap-1"
                      onClick={() => copyCode(group.code)}
                    >
                      <Copy className="h-3 w-3" />
                      {group.code}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {group._count.members} anggota
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(group.createdAt).toLocaleDateString("id-ID")}
                    </span>
                    {group.description && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="truncate max-w-[200px]">{group.description}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/groups/${group.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl gap-1.5 text-xs")}>
                    <Eye className="h-3.5 w-3.5" /> Masuk
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-muted-foreground hover:text-destructive"
                    aria-label="Hapus kelas"
                    onClick={() => handleDelete(group.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
