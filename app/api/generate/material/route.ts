import { streamText } from "ai";
import { model } from "@/lib/ai/provider";
import { CIVIL_ENGINEERING_SYSTEM_PROMPT } from "@/lib/ai/prompts/shared-context";
import { buildMaterialPrompt } from "@/lib/ai/prompts/material-prompt";
import { buildTransformPrompt } from "@/lib/ai/prompts/transform-prompt";
import { requireDosen, type JWTPayload } from "@/lib/auth";
import { generateLimiter, getClientIP, rateLimitResponse } from "@/lib/rate-limit";
import { logAiUsage } from "@/lib/ai/usage-tracker";
import type { GenerateMaterialInput } from "@/lib/types";

export async function POST(req: Request) {
  let session: JWTPayload | undefined;
  try { session = await requireDosen(req); } catch (e) { if (e instanceof Response) return e; }

  const ip = getClientIP(req);
  const limit = generateLimiter.check(ip);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const body: GenerateMaterialInput = await req.json();

  const prompt =
    body.sourceType === "topic"
      ? buildMaterialPrompt(body)
      : buildTransformPrompt(body);

  const maxTokens =
    body.depth === "comprehensive"
      ? 12000
      : body.depth === "standard"
        ? 6000
        : 3000;

  const result = streamText({
    model,
    system: CIVIL_ENGINEERING_SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: maxTokens,
    onFinish: ({ usage }) => {
      logAiUsage({
        userId: session?.userId,
        action: "generate_material",
        model: "gemini-3-flash-preview",
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
      });
    },
  });

  return result.toTextStreamResponse();
}
