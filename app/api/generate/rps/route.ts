import { generateObject } from "ai";
import { model } from "@/lib/ai/provider";
import { CIVIL_ENGINEERING_SYSTEM_PROMPT } from "@/lib/ai/prompts/shared-context";
import { buildRPSPrompt } from "@/lib/ai/prompts/rps-prompt";
import { rpsOutputSchema } from "@/lib/ai/schemas/rps-schema";
import { requireDosen } from "@/lib/auth";
import { generateLimiter, getClientIP, rateLimitResponse } from "@/lib/rate-limit";
import { logAiUsage } from "@/lib/ai/usage-tracker";
import type { GenerateRPSInput } from "@/lib/types";

export async function POST(req: Request) {
  let session;
  try { session = await requireDosen(req); } catch (e) { if (e instanceof Response) return e; }

  const ip = getClientIP(req);
  const limit = generateLimiter.check(ip);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const body: GenerateRPSInput = await req.json();
  const prompt = buildRPSPrompt(body);

  const { object, usage } = await generateObject({
    model,
    system: CIVIL_ENGINEERING_SYSTEM_PROMPT,
    prompt,
    schema: rpsOutputSchema,
  });

  logAiUsage({
    userId: session?.userId,
    action: "generate_material",
    model: "gemini-3-flash-preview",
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
  });

  return Response.json({
    ...object,
    tokensUsed: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
  });
}
