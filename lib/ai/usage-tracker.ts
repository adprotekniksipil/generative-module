import { db, now } from "@/lib/db/firestore";

const PRICING: Record<string, { input: number; output: number }> = {
  "gemini-3-flash-preview": { input: 0.50, output: 3.00 },
  "gemini-3.1-flash-lite-preview": { input: 0.25, output: 1.50 },
  "gemini-3.1-pro-preview": { input: 2.00, output: 12.00 },
  "gemini-2.5-flash": { input: 0.30, output: 2.50 },
  "gemini-2.0-flash": { input: 0.10, output: 0.40 },
};

const IMAGE_PRICING: Record<string, { inputPer1M: number; perImage: number }> = {
  "gemini-3.1-flash-image-preview": { inputPer1M: 0.25, perImage: 0.067 },
  "gemini-3-pro-image-preview": { inputPer1M: 2.00, perImage: 0.134 },
  "gemini-2.5-flash-image": { inputPer1M: 0.30, perImage: 0.039 },
  "gemini-2.5-flash-preview-image-generation": { inputPer1M: 0.30, perImage: 0.039 },
};

const DEFAULT_PRICING = { input: 0.50, output: 3.00 };
const DEFAULT_IMAGE_PRICING = { inputPer1M: 0.25, perImage: 0.067 };

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  isImageGeneration = false
): number {
  if (isImageGeneration) {
    const imgPricing = IMAGE_PRICING[model] || DEFAULT_IMAGE_PRICING;
    return (inputTokens / 1_000_000) * imgPricing.inputPer1M + imgPricing.perImage;
  }
  const pricing = PRICING[model] || DEFAULT_PRICING;
  const cost =
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

export async function logAiUsage(params: {
  userId?: string;
  action: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  isImageGeneration?: boolean;
  metadata?: Record<string, string>;
}) {
  const totalTokens = params.inputTokens + params.outputTokens;
  const estimatedCost = calculateCost(
    params.model,
    params.inputTokens,
    params.outputTokens,
    params.isImageGeneration ?? false
  );

  try {
    const timestamp = now();
    await db.aiUsageLogs.create({
      userId: params.userId ?? null,
      action: params.action,
      model: params.model,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      totalTokens,
      estimatedCost,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      createdAt: timestamp,
    });
  } catch (err) {
    console.error("Failed to log AI usage:", err);
  }
}
