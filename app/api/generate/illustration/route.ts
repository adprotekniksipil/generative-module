import { NextResponse } from "next/server";
import { requireDosen } from "@/lib/auth";
import { generateLimiter, getClientIP, rateLimitResponse } from "@/lib/rate-limit";
import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import { logAiUsage } from "@/lib/ai/usage-tracker";
import { uploadImageBuffer } from "@/lib/cloudinary";
import { randomUUID } from "crypto";

const IMAGE_MODEL = "gemini-2.5-flash-image";

const genai = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });

interface IllustrationInput {
  sectionHeading: string;
  sectionContent: string;
  materialTitle: string;
  style?: string;
}

export async function POST(req: Request) {
  try {
    const session = await requireDosen(req);

    const ip = getClientIP(req);
    const limit = generateLimiter.check(ip);
    if (!limit.allowed) return rateLimitResponse(limit.resetAt);

    if (!env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY belum dikonfigurasi", success: false },
        { status: 500 }
      );
    }

    const body: IllustrationInput = await req.json();

    const prompt = `Create a clean, educational technical illustration for a civil engineering textbook.

Topic: ${body.materialTitle}
Section: ${body.sectionHeading}

Context of the section:
${body.sectionContent.slice(0, 1000)}

Requirements:
- Clean, professional technical illustration suitable for an engineering textbook
- Use clear labels and annotations in Indonesian language
- Style: ${body.style ?? "technical diagram, blueprint style, clean lines"}
- White or light background for readability
- Include relevant engineering symbols and notations
- No photographic elements, keep it as a clean diagram/illustration
- High contrast for print readability
- Aspect ratio 16:9`;

    const response = await genai.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    // Extract image from response parts
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) {
      console.error("Gemini response has no parts:", JSON.stringify(response.candidates?.[0]));
      throw new Error("Tidak ada response dari Gemini");
    }

    // Log what parts we received for debugging
    const partTypes = parts.map((p) => p.inlineData ? `image(${p.inlineData.mimeType})` : `text(${(p.text ?? "").slice(0, 50)})`);
    console.log("Gemini image response parts:", partTypes);

    // Extract real token usage from Google API response
    const usageMeta = response.usageMetadata;
    const inputTokens = usageMeta?.promptTokenCount ?? 0;
    const outputTokens = usageMeta?.candidatesTokenCount ?? 0;

    for (const part of parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;

        if (!base64Data) {
          console.error("Gemini returned inlineData with no data");
          continue;
        }

        const buffer = Buffer.from(base64Data, "base64");
        const publicId = randomUUID();
        const result = await uploadImageBuffer(buffer, "illustrations", publicId);
        const imageUrl = result.secure_url;

        logAiUsage({
          userId: session.userId,
          action: "generate_illustration",
          model: IMAGE_MODEL,
          inputTokens,
          outputTokens,
          isImageGeneration: true,
        });

        return NextResponse.json({
          image: imageUrl,
          success: true,
        });
      }
    }

    // Model returned text only, no image
    const textContent = parts.map((p) => p.text).filter(Boolean).join(" ");
    console.error("Gemini returned text instead of image:", textContent.slice(0, 200));
    throw new Error("Model tidak menghasilkan gambar. Coba lagi.");
  } catch (error) {
    console.error("Illustration generation error:", error);
    const message =
      error instanceof Error ? error.message : "Gagal generate ilustrasi";
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
