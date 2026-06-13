import { db } from "@/lib/db/firestore";
import { markdownToMoodleHtml } from "@/lib/moodle/markdown-to-html";
import { NextRequest } from "next/server";
import type { Material, Quiz, RPS, MaterialAttachment, Setting } from "@/lib/db/types";

async function validateApiKey(req: NextRequest): Promise<boolean> {
  const key = req.headers.get("x-api-key") ?? req.nextUrl.searchParams.get("apikey");
  const stored = await db.settings.get("moodle_api_key") as Setting | null;
  return !!stored && stored.value === key;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await validateApiKey(req))) {
    return Response.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { id } = await params;
  const type = req.nextUrl.searchParams.get("type") ?? "material";

  if (type === "material") {
    const material = await db.materials.get(id) as Material | null;
    if (!material) return Response.json({ error: "Not found" }, { status: 404 });

    const attachments = await db.materialAttachments.list([
      { field: "materialId", op: "==", value: id },
    ]) as MaterialAttachment[];

    const origin = req.nextUrl.origin;
    const html = await markdownToMoodleHtml(material.content, origin);
    const attachmentList = attachments.map((a) => ({
      filename: a.filename,
      fileType: a.fileType,
      fileSize: a.fileSize,
      sectionHeading: a.sectionHeading,
      url: a.url.startsWith("http") ? a.url : `${origin}${a.url.startsWith("/") ? "" : "/"}${a.url}`,
    }));
    return Response.json({
      id: material.id, type: "material", title: material.title,
      summary: material.summary ?? "", content: html, attachments: attachmentList,
    });
  }

  if (type === "quiz") {
    const quiz = await db.quizzes.get(id) as Quiz | null;
    if (!quiz) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ id: quiz.id, type: "quiz", title: quiz.title, questions: quiz.questions });
  }

  if (type === "rps") {
    const rps = await db.rps.get(id) as RPS | null;
    if (!rps) return Response.json({ error: "Not found" }, { status: 404 });
    const origin = req.nextUrl.origin;
    const absoluteFileUrl = rps.fileUrl
      ? rps.fileUrl.startsWith("http") ? rps.fileUrl : `${origin}${rps.fileUrl.startsWith("/") ? "" : "/"}${rps.fileUrl}`
      : null;
    return Response.json({
      id: rps.id, type: "rps", title: rps.title, courseName: rps.courseName,
      courseCode: rps.courseCode, credits: rps.credits, semester: rps.semester,
      semesterType: rps.semesterType, academicYear: rps.academicYear,
      prerequisite: rps.prerequisite, program: rps.program,
      fileUrl: absoluteFileUrl, fileName: rps.fileName, fileType: rps.fileType,
    });
  }

  return Response.json({ error: "Invalid type" }, { status: 400 });
}
