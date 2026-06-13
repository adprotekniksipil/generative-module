import { generateObject } from "ai";
import { model } from "@/lib/ai/provider";
import { CIVIL_ENGINEERING_SYSTEM_PROMPT } from "@/lib/ai/prompts/shared-context";
import { buildQuizPrompt } from "@/lib/ai/prompts/quiz-prompt";
import { quizOutputSchema } from "@/lib/ai/schemas/quiz-schema";
import { requireDosen } from "@/lib/auth";
import { generateLimiter, getClientIP, rateLimitResponse } from "@/lib/rate-limit";
import { logAiUsage } from "@/lib/ai/usage-tracker";
import type { GenerateQuizInput } from "@/lib/types";

export async function POST(req: Request) {
  let session;
  try { session = await requireDosen(req); } catch (e) { if (e instanceof Response) return e; }

  const ip = getClientIP(req);
  const limit = generateLimiter.check(ip);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const body: GenerateQuizInput = await req.json();

  const prompt = buildQuizPrompt(body);

  const { object, usage } = await generateObject({
    model,
    system: CIVIL_ENGINEERING_SYSTEM_PROMPT,
    prompt,
    schema: quizOutputSchema,
  });

  logAiUsage({
    userId: session?.userId,
    action: "generate_quiz",
    model: "gemini-3-flash-preview",
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
  });

  return Response.json({ ...object, tokensUsed: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0) });
}
