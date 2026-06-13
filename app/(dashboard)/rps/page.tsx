"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, BookMarked, Calendar, Trash2, Eye, FileText, Pencil } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface RPSSummary {
  id: string;
  title: string;
  courseName: string;
  courseCode: string | null;
  credits: number;
  semester: number;
  semesterType: string;
  academicYear: string;
  topic: string;
  subTopic: string;
  isPublished: boolean;
  createdAt: string;
}

export default function RPSListPage() {
  const [rpsList, setRpsList] = useState<RPSSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rps")
      .then((r) => r.json())
      .then(setRpsList)
      .catch(() => toast.error("Gagal memuat daftar RPS"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus "${title}"?`)) return;
    try {
      const res = await fetch(`/api/rps/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setRpsList((prev) => prev.filter((r) => r.id !== id));
      toast.success("RPS berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus RPS");
    }
  };

  return (
    <>
      <Header title="Daftar RPS" />
      <div className="p-6 space-y-4">
        {/* Header area */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Memuat..." : `${rpsList.length} RPS tersimpan`}
          </p>
          <Link href="/rps/new" className={cn(buttonVariants(), "rounded-xl gap-1.5")}>
            <PlusCircle className="h-4 w-4" /> Buat RPS Baru
          </Link>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && rpsList.length === 0 && (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center text-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">Belum ada RPS</h3>
            <p className="text-sm text-muted-foreground">
              Mulai dengan membuat RPS pertama Anda menggunakan AI
            </p>
            <Link href="/rps/new" className={cn(buttonVariants(), "rounded-xl gap-1.5 mt-1")}>
              <PlusCircle className="h-4 w-4" /> Buat RPS Pertama
            </Link>
          </div>
        )}

        {/* RPS list */}
        {!isLoading && rpsList.length > 0 && (
          <div className="space-y-3">
            {rpsList.map((rps) => (
              <div
                key={rps.id}
                className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                  <BookMarked className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-sm truncate">{rps.title}</h3>
                    {rps.courseCode && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-mono">
                        {rps.courseCode}
                      </span>
                    )}
                    {rps.isPublished && (
                      <Badge variant="default" className="rounded-md text-[10px]">Dipublikasi</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span>{rps.courseName}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{rps.credits} SKS · Semester {rps.semester}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {rps.semesterType} {rps.academicYear}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/rps/${rps.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl gap-1.5 text-xs")}>
                    <Eye className="h-3.5 w-3.5" /> Lihat
                  </Link>
                  <Link href={`/rps/${rps.id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl gap-1.5 text-xs")}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-muted-foreground hover:text-destructive"
                    aria-label="Hapus RPS"
                    onClick={() => handleDelete(rps.id, rps.title)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
