"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, RefreshCw, Loader2, KeyRound, CheckCircle2 } from "lucide-react";

function generateApiKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function MoodleApiKeyPage() {
  const [apiKey, setApiKey] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/moodle/apikey")
      .then((r) => r.json())
      .then((d) => {
        setApiKey(d.apiKey ?? "");
        setAppUrl(d.appUrl ?? window.location.origin);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/moodle/apikey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (!res.ok) throw new Error();
      toast.success("API key berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan API key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin`);
  };

  return (
    <>
      <Header title="Integrasi Moodle" />
      <div className="p-6 max-w-2xl space-y-6">
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <KeyRound className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">API Key untuk Moodle</h2>
              <p className="text-xs text-muted-foreground">Digunakan plugin Moodle untuk mengakses konten aplikasi</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">URL Aplikasi</Label>
            <div className="flex gap-2">
              <Input value={appUrl} readOnly className="rounded-xl font-mono text-sm" />
              <Button variant="outline" size="sm" className="rounded-xl shrink-0" onClick={() => handleCopy(appUrl, "URL")}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Masukkan URL ini di pengaturan plugin Moodle</p>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">API Key</Label>
            <div className="flex gap-2">
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={isLoading ? "Memuat..." : "Belum ada API key"}
                className="rounded-xl font-mono text-sm"
              />
              <Button variant="outline" size="sm" className="rounded-xl shrink-0" onClick={() => handleCopy(apiKey, "API Key")} disabled={!apiKey}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl shrink-0" onClick={() => setApiKey(generateApiKey())} title="Generate baru">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Masukkan API key ini di pengaturan plugin Moodle</p>
          </div>

          <Button onClick={handleSave} disabled={isSaving || !apiKey} className="rounded-xl gap-2">
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Simpan API Key
          </Button>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-sm">Cara Menggunakan</h2>
          <ol className="space-y-3 text-sm text-muted-foreground list-none">
            {[
              "Generate API key di atas, lalu klik Simpan",
              "Di Moodle: Site Administration → Plugins → Local plugins → Sivil Import → Settings",
              "Isi URL Aplikasi dan API Key yang sudah di-generate",
              "Di Moodle, buka kursus lalu klik Import dari Sivil App di navigasi",
              "Pilih materi/kuis/RPS, pilih seksi, klik Import",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}
