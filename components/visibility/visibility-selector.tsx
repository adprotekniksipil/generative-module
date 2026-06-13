"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Lock, Check, Loader2, AlertTriangle } from "lucide-react";

interface Group {
  id: string;
  name: string;
  code: string;
  _count: { members: number };
}

interface VisibilitySelectorProps {
  isPublished: boolean;
  selectedGroupIds: string[];
  onPublishChange: (published: boolean) => void;
  onGroupsChange: (groupIds: string[]) => void;
}

export function VisibilitySelector({
  isPublished,
  selectedGroupIds,
  onPublishChange,
  onGroupsChange,
}: VisibilitySelectorProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/groups")
      .then((res) => (res.ok ? res.json() : []))
      .then(setGroups)
      .finally(() => setLoading(false));
  }, []);

  const toggleGroup = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      onGroupsChange(selectedGroupIds.filter((id) => id !== groupId));
    } else {
      const newIds = [...selectedGroupIds, groupId];
      onGroupsChange(newIds);
      // Auto-publish when a group is selected
      if (!isPublished) {
        onPublishChange(true);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Publish Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Status Publikasi</p>
          <p className="text-xs text-muted-foreground">
            {isPublished
              ? "Materi terlihat oleh mahasiswa di kelas yang dipilih"
              : "Materi masih draft, belum terlihat mahasiswa"}
          </p>
        </div>
        <Button
          variant={isPublished ? "default" : "outline"}
          size="sm"
          className="rounded-xl gap-1.5"
          onClick={() => onPublishChange(!isPublished)}
        >
          {isPublished ? (
            <>
              <Globe className="h-3.5 w-3.5" />
              Published
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5" />
              Draft
            </>
          )}
        </Button>
      </div>

      {/* Group Multi-Select */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Terlihat oleh Kelas</p>
        <p className="text-xs text-muted-foreground">
          Pilih kelas yang bisa mengakses konten ini
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat kelas...
          </div>
        ) : groups.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            Belum ada kelas. Buat kelas terlebih dahulu di menu{" "}
            <a href="/groups" className="text-primary hover:underline">Kelola Kelas</a>.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => {
              const selected = selectedGroupIds.includes(group.id);
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-input"
                  }`}
                >
                  {selected && <Check className="h-3 w-3" />}
                  {group.name}
                  <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">
                    {group._count.members}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}

        {selectedGroupIds.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedGroupIds.length} kelas dipilih
          </p>
        )}
      </div>

      {/* Warnings */}
      {isPublished && selectedGroupIds.length === 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            Status sudah Published tapi belum ada kelas yang dipilih. Mahasiswa tidak akan bisa melihat konten ini. Pilih minimal satu kelas.
          </p>
        </div>
      )}
      {!isPublished && selectedGroupIds.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            Kelas sudah dipilih tapi status masih Draft. Ubah ke Published agar mahasiswa bisa melihat konten ini.
          </p>
        </div>
      )}
    </div>
  );
}
