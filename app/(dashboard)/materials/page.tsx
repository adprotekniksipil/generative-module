"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus, FileUp, Trash2, Calendar, Eye } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useTopics } from "@/contexts/topics-context";

interface MaterialListItem {
  id: string;
  title: string;
  topic: string;
  subTopic: string;
  difficulty: string;
  sourceType: string;
  wordCount: number;
  createdAt: string;
}

const difficultyLabels: Record<string, string> = {
  beginner: "Dasar",
  intermediate: "Menengah",
  advanced: "Lanjut",
};

export default function MaterialsListPage() {
  const { getTopicLabel, getSubTopicLabel } = useTopics();
  const [materials, setMaterials] = useState<MaterialListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/materials")
      .then((res) => res.json())
      .then(setMaterials)
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus materi "${title}"?`)) return;

    try {
      await fetch(`/api/materials/${id}`, { method: "DELETE" });
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      toast.success("Materi berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus materi");
    }
  };

  return (
    <>
      <Header title="Daftar Materi" />
      <div className="p-6 space-y-4">
        {/* Header area */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Memuat..." : `${materials.length} materi tersimpan`}
          </p>
          <div className="flex items-center gap-2">
            <Link href="/materials/new?source=upload" className={cn(buttonVariants({ variant: "outline" }), "rounded-xl gap-1.5")}>
              <FileUp className="h-4 w-4" /> Upload & Transform
            </Link>
            <Link href="/materials/new" className={cn(buttonVariants(), "rounded-xl gap-1.5")}>
              <Plus className="h-4 w-4" /> Buat Materi Baru
            </Link>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : materials.length === 0 ? (
          /* Empty state */
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center text-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <BookOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">Belum ada materi</h3>
            <p className="text-sm text-muted-foreground">
              Mulai buat materi pembelajaran atau upload dokumen yang sudah ada
            </p>
            <Link href="/materials/new" className={cn(buttonVariants(), "rounded-xl gap-1.5 mt-1")}>
              <Plus className="h-4 w-4" /> Buat Materi Pertama
            </Link>
          </div>
        ) : (
          /* List */
          <div className="space-y-3">
            {materials.map((m) => (
              <div
                key={m.id}
                className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-sm truncate">{m.title}</h3>
                    <Badge variant="secondary" className="rounded-lg text-[11px]">
                      {difficultyLabels[m.difficulty] ?? m.difficulty}
                    </Badge>
                    {m.sourceType !== "topic" && (
                      <Badge variant="outline" className="rounded-lg text-[11px]">
                        {m.sourceType === "file" ? "Upload" : "URL"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span>{getTopicLabel(m.topic)}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{getSubTopicLabel(m.topic, m.subTopic)}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{m.wordCount} kata</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(m.createdAt).toLocaleDateString("id-ID")}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/materials/${m.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl gap-1.5 text-xs")}>
                    <Eye className="h-3.5 w-3.5" /> Lihat
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-muted-foreground hover:text-destructive"
                    aria-label="Hapus materi"
                    onClick={() => handleDelete(m.id, m.title)}
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
