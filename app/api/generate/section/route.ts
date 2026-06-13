import { streamText } from "ai";
import { model } from "@/lib/ai/provider";
import { CIVIL_ENGINEERING_SYSTEM_PROMPT } from "@/lib/ai/prompts/shared-context";
import { requireDosen, type JWTPayload } from "@/lib/auth";
import { generateLimiter, getClientIP, rateLimitResponse } from "@/lib/rate-limit";
import { logAiUsage } from "@/lib/ai/usage-tracker";

interface RegenerateSectionInput {
  materialTitle: string;
  sectionHeading: string;
  sectionContent: string;
  fullMaterialContext: string;
  comment: string;
  difficulty: string;
  language: string;
}

export async function POST(req: Request) {
  let session: JWTPayload | undefined;
  try { session = await requireDosen(req); } catch (e) { if (e instanceof Response) return e; }

  const ip = getClientIP(req);
  const limit = generateLimiter.check(ip);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const body: RegenerateSectionInput = await req.json();

  const lang = body.language === "id" ? "Bahasa Indonesia" : "English";

  const prompt = `Anda diminta untuk menulis ulang/memperbaiki SATU bagian dari modul pembelajaran.

**Judul Modul:** ${body.materialTitle}
**Bagian yang perlu diperbaiki:** ${body.sectionHeading}

**Konten saat ini dari bagian ini:**
---
${body.sectionContent}
---

**Komentar/masukan dari dosen:**
${body.comment}

**Konteks lengkap modul (untuk referensi, JANGAN tulis ulang seluruh modul):**
---
${body.fullMaterialContext}
---

**Instruksi:**
- Tulis HANYA bagian "${body.sectionHeading}" yang sudah diperbaiki sesuai komentar dosen
- Mulai dengan heading yang sama: ## ${body.sectionHeading}
- Pertahankan format Markdown, LaTeX, dan Mermaid jika diperlukan
- Bahasa: ${lang}
- Pastikan konten konsisten dengan bagian lain dari modul
- Jangan menambahkan bagian lain, HANYA tulis bagian yang diminta`;

  const result = streamText({
    model,
    system: CIVIL_ENGINEERING_SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: 4000,
    onFinish: ({ usage }) => {
      logAiUsage({
        userId: session?.userId,
        action: "generate_section",
        model: "gemini-3-flash-preview",
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
      });
    },
  });

  return result.toTextStreamResponse();
}
