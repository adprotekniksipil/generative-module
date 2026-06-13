"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScrollText, Search, BookOpen, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface RPSItem {
  id: string;
  title: string;
  courseName: string;
  courseCode: string | null;
  credits: number;
  semester: number;
  semesterType: string;
  academicYear: string;
  program: string;
  fileUrl: string | null;
  fileType: string | null;
  createdAt: string;
  createdBy: { name: string };
}

export default function StudentRPSPage() {
  const [rpsList, setRpsList] = useState<RPSItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/rps")
      .then((r) => r.json())
      .then((data) => setRpsList(Array.isArray(data) ? data : []))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = rpsList.filter(
    (r) =>
      r.courseName.toLowerCase().includes(search.toLowerCase()) ||
      (r.courseCode ?? "").toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Header title="Rencana Pembelajaran Semester" />
      <div className="p-6 max-w-4xl space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari mata kuliah atau kode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <ScrollText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "Tidak ada RPS yang cocok." : "Belum ada RPS yang dipublikasikan."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((rps) => (
              <Link key={rps.id} href={`/belajar/rps/${rps.id}`}>
                <div className="glass-card rounded-2xl p-5 hover:border-primary/40 hover:shadow-soft transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 items-start min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 shrink-0 mt-0.5">
                        <ScrollText className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {rps.courseCode && (
                            <Badge variant="secondary" className="rounded-lg text-xs font-mono">
                              {rps.courseCode}
                            </Badge>
                          )}
                          <Badge variant="outline" className="rounded-lg text-xs">
                            Smt {rps.semester} {rps.semesterType}
                          </Badge>
                          <Badge variant="outline" className="rounded-lg text-xs">
                            {rps.credits} SKS
                          </Badge>
                          {rps.fileUrl && (
                            <Badge className="rounded-lg text-xs bg-emerald-500/10 text-emerald-700 border-0 hover:bg-emerald-500/20">
                              {(rps.fileType ?? "file").toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold text-sm leading-tight">{rps.courseName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {rps.academicYear} &bull; {rps.program} &bull; oleh {rps.createdBy.name}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
