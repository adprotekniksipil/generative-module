"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import { FolderOpen, Users } from "lucide-react";

interface Group {
  id: string;
  name: string;
  description: string | null;
  code: string;
  _count: { members: number };
}

export default function StudentKelasPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/groups")
      .then((res) => (res.ok ? res.json() : []))
      .then(setGroups)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col">
      <Header title="Kelas Saya" description="Kelas yang Anda ikuti" />
      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <h3 className="font-semibold">Kelas yang Diikuti ({groups.length})</h3>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum terdaftar di kelas manapun</p>
              <p className="text-sm">Hubungi dosen Anda untuk didaftarkan ke kelas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groups.map((group) => (
                <div key={group.id} className="glass-card rounded-xl p-4 space-y-2">
                  <h4 className="font-semibold text-sm">{group.name}</h4>
                  {group.description && (
                    <p className="text-xs text-muted-foreground">{group.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-mono">{group.code}</Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {group._count.members} anggota
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
