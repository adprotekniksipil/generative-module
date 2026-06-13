import { db, now } from "@/lib/db/firestore";
import { getSessionFromRequest, requireDosen } from "@/lib/auth";
import { NextRequest } from "next/server";
import type { RPS, User } from "@/lib/db/types";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json([]);

  if (session.role === "DOSEN") {
    const rps = await db.rps.list([
      { field: "createdById", op: "==", value: session.userId },
    ]) as RPS[];

    const withCreator = await Promise.all(
      rps.map(async (r) => {
        const creator = r.createdById ? await db.users.get(r.createdById) as User | null : null;
        return { ...r, createdBy: creator ? { name: creator.name } : null };
      })
    );

    return Response.json(withCreator);
  }

  // MAHASISWA: published RPS
  const rps = await db.rps.list([
    { field: "isPublished", op: "==", value: true },
  ]) as RPS[];

  const withCreator = await Promise.all(
    rps.map(async (r) => {
      const creator = r.createdById ? await db.users.get(r.createdById) as User | null : null;
      return { ...r, createdBy: creator ? { name: creator.name } : null };
    })
  );

  return Response.json(withCreator);
}

export async function POST(req: Request) {
  try {
    const session = await requireDosen(req);
    const body = await req.json();
    const groupIds: string[] = Array.isArray(body.groupIds) ? body.groupIds : [];

    const timestamp = now();
    const rps = await db.rps.create({
      title: body.title,
      courseName: body.courseName,
      courseCode: body.courseCode || null,
      credits: body.credits ?? 3,
      semester: body.semester ?? 1,
      semesterType: body.semesterType ?? "Ganjil",
      academicYear: body.academicYear ?? "2024/2025",
      prerequisite: body.prerequisite || null,
      program: body.program ?? "Teknik Sipil",
      fileUrl: body.fileUrl || null,
      fileName: body.fileName || null,
      fileType: body.fileType || null,
      fileSize: body.fileSize || null,
      description: body.description ?? "",
      cpl: JSON.stringify(body.cpl ?? []),
      cpmk: JSON.stringify(body.cpmk ?? []),
      assessmentScheme: body.assessmentScheme ? JSON.stringify(body.assessmentScheme) : null,
      references: body.references ? JSON.stringify(body.references) : null,
      weeks: JSON.stringify(body.weeks ?? []),
      topic: body.topic ?? "",
      subTopic: body.subTopic ?? "",
      language: body.language ?? "id",
      modelUsed: body.modelUsed ?? "",
      tokensUsed: body.tokensUsed ?? 0,
      createdById: session.userId,
      isPublished: body.isPublished ?? false,
      groupIds,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return Response.json(rps, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return Response.json({ error: "Gagal menyimpan RPS" }, { status: 500 });
  }
}
