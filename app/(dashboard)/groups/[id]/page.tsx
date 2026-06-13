"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import {
  Copy,
  Trash2,
  ArrowLeft,
  Users,
  UserPlus,
  Loader2,
  Check,
  Search,
} from "lucide-react";

interface Member {
  id: string;
  joinedAt: string;
  user: { id: string; name: string; email: string; role: string };
}

interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  code: string;
  createdAt: string;
  members: Member[];
  _count: { members: number; materials: number; quizzes: number };
}

interface StudentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

function UserInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const colors = [
    "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
    "bg-rose-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color} text-white text-sm font-bold`}>
      {initials || "?"}
    </div>
  );
}

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Add member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [allStudents, setAllStudents] = useState<StudentUser[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    fetch(`/api/groups/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setGroup(data))
      .finally(() => setLoading(false));
  }, [id]);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch("/api/users?role=MAHASISWA");
      if (res.ok) {
        const users = await res.json();
        setAllStudents(users);
      }
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenAddMember = () => {
    setShowAddMember(true);
    setSelectedUserIds([]);
    setStudentSearch("");
    fetchStudents();
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (selectedUserIds.length === 0) return;
    setAddingMembers(true);
    try {
      const res = await fetch(`/api/groups/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUserIds }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.added} mahasiswa ditambahkan ke kelas`);
        setShowAddMember(false);
        setSelectedUserIds([]);
        // Refresh group data
        const groupRes = await fetch(`/api/groups/${id}`);
        if (groupRes.ok) setGroup(await groupRes.json());
      } else {
        toast.error(data.error);
      }
    } finally {
      setAddingMembers(false);
    }
  };

  const removeMember = async (userId: string, userName: string) => {
    if (!confirm(`Keluarkan ${userName} dari kelas?`)) return;
    const res = await fetch(`/api/groups/${id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      toast.success(`${userName} dikeluarkan`);
      setGroup((g) =>
        g ? { ...g, members: g.members.filter((m) => m.user.id !== userId) } : g
      );
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm(`Hapus kelas "${group?.name}"? Semua data kelas akan dihapus.`)) return;
    const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Kelas berhasil dihapus");
      router.push("/groups");
    } else {
      toast.error("Gagal menghapus kelas");
    }
  };

  const copyCode = () => {
    if (group) {
      navigator.clipboard.writeText(group.code);
      toast.success(`Kode "${group.code}" disalin`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        <Header title="Detail Kelas" description="" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col">
        <Header title="Kelas Tidak Ditemukan" description="" />
        <div className="p-6">
          <div className="glass-card rounded-2xl p-10 text-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Kelas tidak ditemukan.</p>
            <button onClick={() => router.push("/groups")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Kembali ke daftar kelas
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter students not already in group
  const memberUserIds = new Set(group.members.map((m) => m.user.id));
  const availableStudents = allStudents
    .filter((s) => !memberUserIds.has(s.id))
    .filter(
      (s) =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase())
    );

  return (
    <div className="flex flex-col">
      <Header title={group.name} description={group.description || "Kelola anggota kelas"} />
      <div className="p-6 space-y-6">
        <button onClick={() => router.push("/groups")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Daftar Kelas
        </button>

        {/* Group Info */}
        <div className="glass-card rounded-2xl p-5 flex flex-wrap items-center gap-4">
          <Badge variant="secondary" className="font-mono text-sm cursor-pointer" onClick={copyCode}>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Kode: {group.code}
          </Badge>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {group.members.length} anggota
          </span>
          <span className="text-sm text-muted-foreground">
            {group._count.materials} materi &bull; {group._count.quizzes} kuis
          </span>
        </div>

        {/* Members List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Anggota ({group.members.length})</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteGroup}
                className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Hapus Kelas"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <Button size="sm" className="rounded-xl gap-1.5" onClick={handleOpenAddMember}>
                <UserPlus className="h-4 w-4" />
                Tambah Mahasiswa
              </Button>
            </div>
          </div>

          {/* Add Member Panel */}
          {showAddMember && (
            <div className="glass-card rounded-xl p-5 space-y-4 border-2 border-primary/20">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Pilih Mahasiswa
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddMember(false)}
                >
                  Batal
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {loadingStudents ? (
                <div className="flex items-center gap-2 py-4 justify-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat daftar mahasiswa...
                </div>
              ) : availableStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {allStudents.length === 0
                    ? "Belum ada mahasiswa terdaftar."
                    : studentSearch
                    ? "Tidak ditemukan mahasiswa yang cocok."
                    : "Semua mahasiswa sudah terdaftar di kelas ini."}
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-xl">
                  {availableStudents.map((student) => {
                    const isSelected = selectedUserIds.includes(student.id);
                    return (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => toggleSelectUser(student.id)}
                        className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted border border-transparent"
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{student.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedUserIds.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    {selectedUserIds.length} mahasiswa dipilih
                  </p>
                  <Button
                    size="sm"
                    className="rounded-xl gap-1.5"
                    onClick={handleAddMembers}
                    disabled={addingMembers}
                  >
                    {addingMembers ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    Tambahkan
                  </Button>
                </div>
              )}
            </div>
          )}

          {group.members.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center">
              <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">Belum ada anggota</p>
              <p className="text-xs text-muted-foreground">Klik <strong>Tambah Mahasiswa</strong> untuk menambahkan mahasiswa ke kelas ini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 glass-card rounded-2xl p-4">
                  <UserInitials name={member.user.name} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{member.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString("id-ID")}
                    </span>
                    <button onClick={() => removeMember(member.user.id, member.user.name)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
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
