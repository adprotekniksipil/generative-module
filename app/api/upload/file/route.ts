import { NextRequest } from "next/server";
import mammoth from "mammoth";
import officeParser from "officeparser";
import { requireDosen } from "@/lib/auth";
import { apiLimiter, getClientIP, rateLimitResponse } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try { await requireDosen(req); } catch (e) { if (e instanceof Response) return e; }

  // Rate limit
  const ip = getClientIP(req);
  const limit = apiLimiter.check(ip);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  // File size check
  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: `Ukuran file melebihi batas maksimal (${MAX_FILE_SIZE / 1024 / 1024}MB)` },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";

  try {
    if (file.type === "application/pdf") {
      // Dynamic import to avoid pdf-parse loading test files at module init
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (file.type === "text/plain") {
      text = buffer.toString("utf-8");
    } else if (
      file.type === "application/vnd.ms-powerpoint" ||
      file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      text = await (officeParser.parseOffice as any)(buffer) as string;
    } else {
      return Response.json(
        { error: "Format tidak didukung. Gunakan PDF, DOCX, TXT, PPT, atau PPTX." },
        { status: 400 }
      );
    }

    // Clean up extracted text
    text = text.replace(/\n{3,}/g, "\n\n").trim();

    return Response.json({
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      filename: file.name,
    });
  } catch {
    return Response.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}
