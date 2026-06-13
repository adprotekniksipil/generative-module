"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Hash,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

function StatusMessage({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${
        type === "error"
          ? "border-destructive/30 bg-destructive/8 text-destructive"
          : "border-emerald-500/30 bg-emerald-500/8 text-emerald-700 dark:text-emerald-400"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      {message}
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function getPasswordStrength(pw: string): { label: string; color: string; width: string } | null {
  if (!pw) return null;
  if (pw.length < 6) return { label: "Terlalu pendek", color: "bg-destructive", width: "w-1/4" };
  if (pw.length < 8) return { label: "Lemah", color: "bg-orange-500", width: "w-2/4" };
  if (pw.length < 12) return { label: "Sedang", color: "bg-amber-500", width: "w-3/4" };
  return { label: "Kuat", color: "bg-emerald-500", width: "w-full" };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: "", email: "", nim: "" });
  const [profileStatus, setProfileStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name, email: user.email, nim: user.nim ?? "" });
    }
  }, [user]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileStatus(null);
    setProfileLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileForm.name, email: profileForm.email, nim: profileForm.nim }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileStatus({ type: "error", message: data.error ?? "Gagal memperbarui profil" });
      } else {
        setProfileStatus({ type: "success", message: "Profil berhasil diperbarui" });
        await refreshUser();
      }
    } catch {
      setProfileStatus({ type: "error", message: "Terjadi kesalahan jaringan" });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordStatus(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: "error", message: "Konfirmasi password tidak cocok" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "Password baru minimal 6 karakter" });
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordStatus({ type: "error", message: data.error ?? "Gagal mengubah password" });
      } else {
        setPasswordStatus({ type: "success", message: "Password berhasil diubah" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch {
      setPasswordStatus({ type: "error", message: "Terjadi kesalahan jaringan" });
    } finally {
      setPasswordLoading(false);
    }
  }

  const pwStrength = getPasswordStrength(passwordForm.newPassword);

  return (
    <>
      <Header title="Profil Saya" description="Kelola informasi akun dan keamanan" />
      <div className="p-6 space-y-6 max-w-2xl">

        {/* Identity card */}
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#1d5b6b] text-white text-xl font-bold shadow-sm">
            {user ? getInitials(user.name) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold truncate">{user?.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email ?? "—"}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge
                className={`rounded-md text-[11px] px-2 py-0.5 border-0 ${
                  user?.role === "DOSEN"
                    ? "bg-blue-500/10 text-blue-700"
                    : "bg-emerald-500/10 text-emerald-700"
                }`}
              >
                {user?.role === "DOSEN" ? "Dosen" : "Mahasiswa"}
              </Badge>
              {user?.nim && (
                <span className="text-[11px] text-muted-foreground font-medium">
                  NIM/NIP: {user.nim}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit profile */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Informasi Profil</h2>
              <p className="text-[12px] text-muted-foreground">Perbarui nama, email, dan NIM/NIP</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Nama Lengkap
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Masukkan nama lengkap"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Masukkan email"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nim" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                NIM / NIP <span className="normal-case font-normal text-muted-foreground/70">(opsional)</span>
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nim"
                  value={profileForm.nim}
                  onChange={(e) => setProfileForm((f) => ({ ...f, nim: e.target.value }))}
                  placeholder="Masukkan NIM atau NIP"
                  className="pl-9"
                />
              </div>
            </div>

            {profileStatus && <StatusMessage {...profileStatus} />}

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={profileLoading} size="sm">
                {profileLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </div>

        {/* Change password */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <ShieldCheck className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Ubah Password</h2>
              <p className="text-[12px] text-muted-foreground">Gunakan password yang kuat dan unik</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Password Saat Ini
              </Label>
              <PasswordInput
                id="currentPassword"
                value={passwordForm.currentPassword}
                onChange={(v) => setPasswordForm((f) => ({ ...f, currentPassword: v }))}
                placeholder="Masukkan password saat ini"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Password Baru
              </Label>
              <PasswordInput
                id="newPassword"
                value={passwordForm.newPassword}
                onChange={(v) => setPasswordForm((f) => ({ ...f, newPassword: v }))}
                placeholder="Minimal 6 karakter"
                required
              />
              {pwStrength && (
                <div className="space-y-1 pt-0.5">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pwStrength.color} ${pwStrength.width}`} />
                  </div>
                  <p className={`text-[11px] font-medium ${
                    pwStrength.label === "Kuat" ? "text-emerald-600" :
                    pwStrength.label === "Sedang" ? "text-amber-600" : "text-destructive"
                  }`}>
                    Kekuatan: {pwStrength.label}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Konfirmasi Password Baru
              </Label>
              <PasswordInput
                id="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={(v) => setPasswordForm((f) => ({ ...f, confirmPassword: v }))}
                placeholder="Ulangi password baru"
                required
              />
              {passwordForm.confirmPassword && passwordForm.newPassword && (
                <p className={`text-[11px] font-medium flex items-center gap-1 ${
                  passwordForm.newPassword === passwordForm.confirmPassword
                    ? "text-emerald-600"
                    : "text-destructive"
                }`}>
                  {passwordForm.newPassword === passwordForm.confirmPassword ? (
                    <><CheckCircle2 className="h-3 w-3" /> Password cocok</>
                  ) : (
                    <><AlertCircle className="h-3 w-3" /> Password tidak cocok</>
                  )}
                </p>
              )}
            </div>

            {passwordStatus && <StatusMessage {...passwordStatus} />}

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={passwordLoading} size="sm">
                {passwordLoading ? "Mengubah..." : "Ubah Password"}
              </Button>
            </div>
          </form>
        </div>

      </div>
    </>
  );
}
