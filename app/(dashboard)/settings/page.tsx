"use client";

import { useEffect, useState } from "react";
import {
  Cpu,
  Zap,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";

interface UsageData {
  overview: {
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCost: number;
    totalCostIDR: number;
  };
  actionBreakdown: Array<{
    action: string;
    count: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }>;
  modelBreakdown: Array<{
    model: string;
    count: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }>;
  dailyUsage: Array<{
    date: string;
    tokens: number;
    cost: number;
    count: number;
  }>;
  recentLogs: Array<{
    id: string;
    action: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
    createdAt: string;
  }>;
}

const ACTION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  generate_material: { label: "Generate Materi", color: "text-blue-600", bg: "bg-blue-500/10" },
  generate_quiz: { label: "Generate Kuis", color: "text-violet-600", bg: "bg-violet-500/10" },
  grade_essay: { label: "Penilaian Esai", color: "text-emerald-600", bg: "bg-emerald-500/10" },
  generate_illustration: { label: "Generate Ilustrasi", color: "text-amber-600", bg: "bg-amber-500/10" },
  generate_section: { label: "Regenerasi Bagian", color: "text-rose-600", bg: "bg-rose-500/10" },
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatCostUSD(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SettingsPage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "logs">("overview");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/settings/ai-usage");
        if (res.ok) setData(await res.json());
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <Header title="Pengaturan" description="Penggunaan AI dan informasi biaya" />
        <div className="p-6">
          <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">
            Memuat data penggunaan AI...
          </div>
        </div>
      </>
    );
  }

  const overview = data?.overview ?? {
    totalCalls: 0, totalInputTokens: 0, totalOutputTokens: 0,
    totalTokens: 0, totalCost: 0, totalCostIDR: 0,
  };

  return (
    <>
      <Header title="Pengaturan" description="Penggunaan AI dan informasi biaya" />
      <div className="p-6 space-y-6">
        {/* Pricing Info Card */}
        <div className="glass-card rounded-2xl p-5 border-primary/10 bg-primary/[0.03]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1">Model AI yang Digunakan</h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><span className="font-medium text-foreground">Gemini 3 Flash</span> — Generate materi, kuis, penilaian esai, regenerasi bagian</p>
                <p><span className="font-medium text-foreground">Gemini 2.5 Flash Image</span> — Generate ilustrasi teknis</p>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border p-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Input (3 Flash)</p>
                  <p className="text-sm font-bold">$0.50<span className="text-[10px] text-muted-foreground font-normal">/1M token</span></p>
                </div>
                <div className="rounded-lg border p-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Output (3 Flash)</p>
                  <p className="text-sm font-bold">$3.00<span className="text-[10px] text-muted-foreground font-normal">/1M token</span></p>
                </div>
                <div className="rounded-lg border p-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Image (2.5 Flash)</p>
                  <p className="text-sm font-bold">$0.039<span className="text-[10px] text-muted-foreground font-normal">/gambar</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                <Zap className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Panggilan</p>
                <p className="text-2xl font-bold">{overview.totalCalls}</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Token</p>
                <p className="text-2xl font-bold">{formatNumber(overview.totalTokens)}</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Biaya (USD)</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCostUSD(overview.totalCost)}</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Biaya (IDR)</p>
                <p className="text-2xl font-bold text-amber-600">
                  Rp {overview.totalCostIDR.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Token Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Per Action */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
              Penggunaan per Fitur
            </h3>
            {(data?.actionBreakdown ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {(data?.actionBreakdown ?? [])
                  .sort((a, b) => b.cost - a.cost)
                  .map((a) => {
                    const meta = ACTION_LABELS[a.action] ?? { label: a.action, color: "text-gray-600", bg: "bg-gray-500/10" };
                    return (
                      <div key={a.action} className="flex items-center justify-between p-3 rounded-xl border">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.bg}`}>
                            <Zap className={`h-4 w-4 ${meta.color}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{meta.label}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {a.count}x panggilan · {formatNumber(a.inputTokens + a.outputTokens)} token
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatCostUSD(a.cost)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Rp {(a.cost * 16000).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Per Model */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
              Penggunaan per Model
            </h3>
            {(data?.modelBreakdown ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {(data?.modelBreakdown ?? []).map((m) => (
                  <div key={m.model} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold">{m.model}</p>
                        <p className="text-[11px] text-muted-foreground">{m.count}x panggilan</p>
                      </div>
                      <p className="text-sm font-bold text-emerald-600">{formatCostUSD(m.cost)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-muted/50 p-2.5">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium mb-0.5">
                          <ArrowUpRight className="h-3 w-3" /> Input
                        </div>
                        <p className="text-sm font-bold">{formatNumber(m.inputTokens)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2.5">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium mb-0.5">
                          <ArrowDownRight className="h-3 w-3" /> Output
                        </div>
                        <p className="text-sm font-bold">{formatNumber(m.outputTokens)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Daily Chart */}
        {(data?.dailyUsage ?? []).length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
              Penggunaan Harian (30 Hari Terakhir)
            </h3>
            <div className="flex items-end gap-1 h-32">
              {(data?.dailyUsage ?? []).map((day) => {
                const maxTokens = Math.max(...(data?.dailyUsage ?? []).map((d) => d.tokens), 1);
                const height = Math.max((day.tokens / maxTokens) * 100, 5);
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-10 hidden group-hover:block bg-foreground text-background text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-10">
                      {formatDate(day.date)}: {formatNumber(day.tokens)} token · {formatCostUSD(day.cost)} ({day.count}x)
                    </div>
                    <div
                      className="w-full rounded-t-md bg-primary/70 transition-all hover:bg-primary"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[7px] text-muted-foreground truncate w-full text-center">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div>
          <div className="flex gap-1 mb-4 bg-muted/50 rounded-xl p-1 w-fit">
            {[
              { key: "overview" as const, label: "Ringkasan" },
              { key: "logs" as const, label: "Log Terbaru" },
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

          {tab === "overview" && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-3">Estimasi Biaya per Aktivitas</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Aktivitas</th>
                      <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase text-right">Est. Token/Panggilan</th>
                      <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase text-right">Est. Biaya/Panggilan</th>
                      <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase text-right">100x Panggilan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 text-sm">
                    <tr>
                      <td className="px-3 py-2.5 font-medium">Generate Materi (Standard)</td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground">~8,000</td>
                      <td className="px-3 py-2.5 text-right">$0.020</td>
                      <td className="px-3 py-2.5 text-right font-medium">$2.00 (Rp 32.000)</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium">Generate Materi (Comprehensive)</td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground">~15,000</td>
                      <td className="px-3 py-2.5 text-right">$0.038</td>
                      <td className="px-3 py-2.5 text-right font-medium">$3.80 (Rp 60.800)</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium">Generate Kuis (10 soal)</td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground">~5,000</td>
                      <td className="px-3 py-2.5 text-right">$0.013</td>
                      <td className="px-3 py-2.5 text-right font-medium">$1.30 (Rp 20.800)</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium">Penilaian Esai (5 soal)</td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground">~3,000</td>
                      <td className="px-3 py-2.5 text-right">$0.008</td>
                      <td className="px-3 py-2.5 text-right font-medium">$0.80 (Rp 12.800)</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium">Generate Ilustrasi</td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground">—</td>
                      <td className="px-3 py-2.5 text-right">$0.039</td>
                      <td className="px-3 py-2.5 text-right font-medium">$3.90 (Rp 62.400)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                * Berdasarkan harga resmi Gemini API (ai.google.dev/gemini-api/docs/pricing).
                Teks: Gemini 3 Flash. Ilustrasi: Gemini 2.5 Flash Image ($0.039/gambar). Kurs: $1 = Rp 16.000.
              </p>
            </div>
          )}

          {tab === "logs" && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Waktu</th>
                      <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Fitur</th>
                      <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Model</th>
                      <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase text-right">Input</th>
                      <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase text-right">Output</th>
                      <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase text-right">Biaya</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {(data?.recentLogs ?? []).map((log) => {
                      const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: "text-gray-600", bg: "bg-gray-500/10" };
                      return (
                        <tr key={log.id} className="hover:bg-accent/50 transition-colors">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDate(log.createdAt)} {formatTime(log.createdAt)}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge className={`${meta.bg} ${meta.color} border-0 rounded-md text-[10px]`}>
                              {meta.label}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground">{log.model}</td>
                          <td className="px-3 py-2.5 text-xs text-right font-medium">{formatNumber(log.inputTokens)}</td>
                          <td className="px-3 py-2.5 text-xs text-right font-medium">{formatNumber(log.outputTokens)}</td>
                          <td className="px-3 py-2.5 text-xs text-right font-bold text-emerald-600">
                            {formatCostUSD(log.estimatedCost)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {(data?.recentLogs ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada log penggunaan AI. Data akan muncul setelah Anda generate materi atau kuis.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
