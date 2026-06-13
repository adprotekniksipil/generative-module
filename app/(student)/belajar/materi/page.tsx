"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Calendar, Search } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTopics } from "@/contexts/topics-context";

interface Material {
  id: string;
  title: string;
  topic: string;
  subTopic: string;
  difficulty: string;
  wordCount: number;
  createdAt: string;
}

const difficultyLabels: Record<string, string> = {
  beginner: "Dasar",
  intermediate: "Menengah",
  advanced: "Lanjut",
};

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-rose-100 text-rose-700",
};

export default function StudentMaterialsPage() {
  const { getTopicLabel, getSubTopicLabel } = useTopics();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/materials")
      .then((res) => res.json())
      .then(setMaterials)
      .finally(() => setLoading(false));
  }, []);

  const filtered = materials.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.subTopic.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Header title="Materi Pembelajaran" description="Pelajari materi teknik sipil" />
      <div className="p-6 space-y-5">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari materi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </div>

        {/* Materials Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "Tidak ada materi yang cocok." : "Belum ada materi tersedia."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((mat) => (
              <Link key={mat.id} href={`/belajar/materi/${mat.id}`}>
                <div className="glass-card rounded-2xl p-5 hover:shadow-soft-lg transition-all cursor-pointer group h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 shrink-0">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {mat.title}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Badge variant="secondary" className="rounded-lg text-[11px]">
                      {getTopicLabel(mat.topic)}
                    </Badge>
                    <Badge variant="outline" className="rounded-lg text-[11px]">
                      {getSubTopicLabel(mat.topic, mat.subTopic)}
                    </Badge>
                  </div>
                  <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${difficultyColors[mat.difficulty] ?? ""}`}>
                      {difficultyLabels[mat.difficulty] ?? mat.difficulty}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(mat.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
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
