import Link from "next/link";
import { GraduationCap, LogIn, UserPlus } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <GraduationCap className="h-7 w-7" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Modul Generator
          </h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            Aplikasi pembelajaran teknik sipil berbasis AI.
            Masuk atau daftar untuk memulai.
          </p>
        </div>

        {/* Auth Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <div className="glass-card rounded-2xl p-6 hover:shadow-soft-lg transition-all cursor-pointer group border-2 border-transparent hover:border-primary/20 text-center">
              <LogIn className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h2 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                Masuk
              </h2>
              <p className="text-sm text-muted-foreground">
                Sudah punya akun? Login di sini.
              </p>
            </div>
          </Link>

          <Link href="/register">
            <div className="glass-card rounded-2xl p-6 hover:shadow-soft-lg transition-all cursor-pointer group border-2 border-transparent hover:border-emerald-500/20 text-center">
              <UserPlus className="h-8 w-8 mx-auto mb-3 text-emerald-600" />
              <h2 className="text-lg font-bold mb-1 group-hover:text-emerald-600 transition-colors">
                Daftar
              </h2>
              <p className="text-sm text-muted-foreground">
                Mahasiswa baru? Buat akun gratis.
              </p>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Didukung oleh Google Gemini AI &bull; Teknik Sipil Indonesia
        </p>
      </div>
    </div>
  );
}
