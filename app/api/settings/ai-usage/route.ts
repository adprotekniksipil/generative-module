import { db } from "@/lib/db/firestore";
import { requireDosen } from "@/lib/auth";
import type { AiUsageLog } from "@/lib/db/types";

export async function GET(req: Request) {
  try {
    await requireDosen(req);

    const logs = await db.aiUsageLogs.list() as AiUsageLog[];

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;

    for (const log of logs) {
      totalInputTokens += log.inputTokens;
      totalOutputTokens += log.outputTokens;
      totalCost += log.estimatedCost;
    }

    const actionMap = new Map<string, { count: number; inputTokens: number; outputTokens: number; cost: number }>();
    for (const log of logs) {
      const e = actionMap.get(log.action) ?? { count: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
      e.count++; e.inputTokens += log.inputTokens; e.outputTokens += log.outputTokens; e.cost += log.estimatedCost;
      actionMap.set(log.action, e);
    }
    const actionBreakdown = Array.from(actionMap.entries()).map(([action, stats]) => ({
      action, ...stats, cost: Math.round(stats.cost * 1_000_000) / 1_000_000,
    }));

    const modelMap = new Map<string, { count: number; inputTokens: number; outputTokens: number; cost: number }>();
    for (const log of logs) {
      const e = modelMap.get(log.model) ?? { count: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
      e.count++; e.inputTokens += log.inputTokens; e.outputTokens += log.outputTokens; e.cost += log.estimatedCost;
      modelMap.set(log.model, e);
    }
    const modelBreakdown = Array.from(modelMap.entries()).map(([model, stats]) => ({
      model, ...stats, cost: Math.round(stats.cost * 1_000_000) / 1_000_000,
    }));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    const dailyMap = new Map<string, { tokens: number; cost: number; count: number }>();
    for (const log of logs) {
      if (log.createdAt < thirtyDaysAgoStr) continue;
      const date = log.createdAt.split("T")[0];
      const e = dailyMap.get(date) ?? { tokens: 0, cost: 0, count: 0 };
      e.tokens += log.totalTokens; e.cost += log.estimatedCost; e.count++;
      dailyMap.set(date, e);
    }
    const dailyUsage = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats, cost: Math.round(stats.cost * 1_000_000) / 1_000_000 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const recentLogs = logs.slice(0, 50).map((log) => ({
      id: log.id, action: log.action, model: log.model,
      inputTokens: log.inputTokens, outputTokens: log.outputTokens,
      totalTokens: log.totalTokens, estimatedCost: log.estimatedCost, createdAt: log.createdAt,
    }));

    return Response.json({
      overview: {
        totalCalls: logs.length, totalInputTokens, totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        totalCost: Math.round(totalCost * 1_000_000) / 1_000_000,
        totalCostIDR: Math.round(totalCost * 16000 * 100) / 100,
      },
      actionBreakdown, modelBreakdown, dailyUsage, recentLogs,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal memuat data penggunaan AI" }, { status: 500 });
  }
}
