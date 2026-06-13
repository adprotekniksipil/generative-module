"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, User, Mail, Hash, Lock, Eye, EyeOff } from "lucide-react";

export default function ProfilPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"info" | "password">("info");

  // Profile fields
  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setNim(user.nim || "");
      setEmail(user.email);
    }
  }, [user]);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }
    if (!nim.trim()) {
      toast.error("NIM tidak boleh kosong");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), nim: nim.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal memperbarui profil");
        return;
      }
      toast.success("Profil berhasil diperbarui");
      await refreshUser();
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mengubah password");
        return;
      }
      toast.success("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header title="Profil Saya" description="Kelola informasi akun Anda" />
      <div className="p-6 max-w-2xl space-y-6">
        {/* Avatar & Info */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 text-2xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-lg font-bold">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {user?.nim && (
                <p className="text-xs text-muted-foreground mt-0.5">NIM: {user.nim}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
          {[
            { key: "info" as const, label: "Informasi" },
            { key: "password" as const, label: "Ubah Password" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Edit Profile */}
        {tab === "info" && (
          <form onSubmit={handleUpdateProfile} className="glass-card rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Informasi Pribadi
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                NIM
              </label>
              <input
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                required
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <Button type="submit" className="rounded-xl" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Perubahan
            </Button>
          </form>
        )}

        {/* Change Password */}
        {tab === "password" && (
          <form onSubmit={handleChangePassword} className="glass-card rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Ubah Password
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Password Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Password Baru
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Ulangi password baru"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <Button type="submit" className="rounded-xl" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Ubah Password
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
