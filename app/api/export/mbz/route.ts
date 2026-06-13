import { requireDosen } from "@/lib/auth";
import { db } from "@/lib/db/firestore";
import { generateMaterialMbz, generateQuizMbz, generateRpsMbz } from "@/lib/moodle/mbz-generator";
import type { Material, Quiz, RPS, MaterialAttachment } from "@/lib/db/types";

export async function POST(req: Request) {
  try { await requireDosen(req); } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, id } = await req.json();
  if (!type || !id) return Response.json({ error: "type dan id wajib diisi" }, { status: 400 });

  try {
    let buffer: Buffer;
    let filename: string;

    const appBaseUrl = new URL(req.url).origin;

    if (type === "material") {
      const material = await db.materials.get(id) as Material | null;
      if (!material) return Response.json({ error: "Materi tidak ditemukan" }, { status: 404 });
      const attachments = await db.materialAttachments.list([
        { field: "materialId", op: "==", value: id },
      ]) as MaterialAttachment[];
      buffer = await generateMaterialMbz(material, { appBaseUrl, attachments });
      filename = `${material.title.replace(/[^a-z0-9]/gi, "_")}.mbz`;

    } else if (type === "quiz") {
      const quiz = await db.quizzes.get(id) as Quiz | null;
      if (!quiz) return Response.json({ error: "Kuis tidak ditemukan" }, { status: 404 });
      buffer = await generateQuizMbz({ title: quiz.title, questions: quiz.questions });
      filename = `${quiz.title.replace(/[^a-z0-9]/gi, "_")}.mbz`;

    } else if (type === "rps") {
      const rps = await db.rps.get(id) as RPS | null;
      if (!rps) return Response.json({ error: "RPS tidak ditemukan" }, { status: 404 });
      buffer = await generateRpsMbz(rps, { appBaseUrl });
      filename = `RPS_${rps.title.replace(/[^a-z0-9]/gi, "_")}.mbz`;

    } else {
      return Response.json({ error: "type tidak valid" }, { status: 400 });
    }

    return new Response(buffer as unknown as BodyInit, {
      headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${filename}"` },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Gagal generate MBZ" },
      { status: 500 }
    );
  }
}
