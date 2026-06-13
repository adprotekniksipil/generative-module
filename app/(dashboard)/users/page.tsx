"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import { Shield, ShieldOff, Trash2, Users, KeyRound, Eye, EyeOff, Loader2, X } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isBlocked: boolean;
  createdAt: string;
  _count: { memberships: number };
}

function ChangePasswordModal({
  user,
  onClose,
  onSuccess,
}: {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    if (password !== confirm) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Gagal mengganti password");
      }
      toast.success(`Password ${user.name} berhasil diganti`);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm mx-4 glass-card rounded-2xl p-6 shadow-soft-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold">Ganti Password</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{user.name} &bull; {user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Password Baru <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="rounded-xl pr-10"
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Konfirmasi Password <span className="text-destructive">*</span></Label>
            <Input
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ulangi password baru"
              className="rounded-xl"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
              ) : (
                <><KeyRound className="h-4 w-4" /> Simpan</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserInitials({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const colorClass =
    role === "DOSEN"
      ? "bg-primary text-primary-foreground"
      : "bg-violet-500 text-white";

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${colorClass}`}
    >
      {initials}
    </div>
  );
}

const FILTERS = [
  { label: "Semua", value: "" },
  { label: "Dosen", value: "DOSEN" },
  { label: "Mahasiswa", value: "MAHASISWA" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [changingPasswordFor, setChangingPasswordFor] = useState<User | null>(null);

  useEffect(() => {
    const url = filter ? `/api/users?role=${filter}` : "/api/users";
    fetch(url)
      .then((res) => (res.ok ? res.json() : []))
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [filter]);

  const toggleBlock = async (user: User) => {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlocked: !user.isBlocked }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((u) => u.map((x) => (x.id === user.id ? { ...x, isBlocked: updated.isBlocked } : x)));
      toast.success(updated.isBlocked ? `${user.name} diblokir` : `${user.name} dibuka blokirnya`);
    }
  };

  const deleteUser = async (user: User) => {
    if (!confirm(`Hapus akun ${user.name}? Tindakan ini tidak bisa dibatalkan.`)) return;
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((u) => u.filter((x) => x.id !== user.id));
      toast.success(`Akun ${user.name} dihapus`);
    }
  };

  return (
    <>
      {changingPasswordFor && (
        <ChangePasswordModal
          user={changingPasswordFor}
          onClose={() => setChangingPasswordFor(null)}
          onSuccess={() => setChangingPasswordFor(null)}
        />
      )}

      <div className="flex flex-col">
        <Header
          title="Kelola Pengguna"
          description="Lihat, blokir, atau hapus akun pengguna"
        />
        <div className="p-6 space-y-4">
          {/* Stats + filter */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {loading ? "Memuat..." : `${users.length} pengguna`}
            </p>
            <div className="flex items-center gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    filter === f.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : users.length === 0 ? (
            /* Empty state */
            <div className="glass-card rounded-2xl p-12 flex flex-col items-center text-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">Tidak ada pengguna</h3>
              <p className="text-sm text-muted-foreground">
                {filter ? `Tidak ada pengguna dengan role ${filter}` : "Belum ada pengguna terdaftar"}
              </p>
            </div>
          ) : (
            /* User list */
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`glass-card rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all ${
                    user.isBlocked ? "opacity-60" : ""
                  }`}
                >
                  <UserInitials name={user.name} role={user.role} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-sm truncate">{user.name}</h3>
                      <Badge
                        variant={user.role === "DOSEN" ? "default" : "secondary"}
                        className="rounded-lg text-[10px]"
                      >
                        {user.role}
                      </Badge>
                      {user.isBlocked && (
                        <Badge variant="destructive" className="rounded-lg text-[10px]">Diblokir</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {user.email} &bull; {user._count.memberships} kelas &bull;{" "}
                      {new Date(user.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-muted-foreground hover:text-foreground"
                      onClick={() => setChangingPasswordFor(user)}
                      aria-label="Ganti password"
                      title="Ganti password"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-muted-foreground hover:text-foreground"
                      onClick={() => toggleBlock(user)}
                      aria-label={user.isBlocked ? "Buka blokir" : "Blokir pengguna"}
                      title={user.isBlocked ? "Buka blokir" : "Blokir"}
                    >
                      {user.isBlocked ? (
                        <ShieldOff className="h-4 w-4" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-muted-foreground hover:text-destructive"
                      onClick={() => deleteUser(user)}
                      aria-label="Hapus akun"
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
    </>
  );
}
