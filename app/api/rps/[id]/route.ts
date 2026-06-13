import { db, now } from "@/lib/db/firestore";
import { getSessionFromRequest, requireDosen } from "@/lib/auth";
import { NextRequest } from "next/server";
import type { RPS, User } from "@/lib/db/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rps = await db.rps.get(id) as RPS | null;
  if (!rps) return Response.json({ error: "RPS tidak ditemukan" }, { status: 404 });

  const isOwner = session.role === "DOSEN" && rps.createdById === session.userId;
  const isPublicAccess = rps.isPublished;

  if (!isOwner && !isPublicAccess) {
    return Response.json({ error: "RPS tidak ditemukan" }, { status: 404 });
  }

  const creator = rps.createdById ? await db.users.get(rps.createdById) as User | null : null;

  return Response.json({
    ...rps,
    cpl: JSON.parse(rps.cpl),
    cpmk: JSON.parse(rps.cpmk),
    weeks: JSON.parse(rps.weeks),
    assessmentScheme: rps.assessmentScheme ? JSON.parse(rps.assessmentScheme) : [],
    references: rps.references ? JSON.parse(rps.references) : [],
    createdBy: creator ? { name: creator.name } : null,
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireDosen(req);
    const body = await req.json();

    const existing = await db.rps.get(id) as RPS | null;
    if (!existing || existing.createdById !== session.userId) {
      return Response.json({ error: "RPS tidak ditemukan" }, { status: 404 });
    }

    const groupIds: string[] = Array.isArray(body.groupIds) ? body.groupIds : existing.groupIds;

    const updateData: Partial<RPS> & Record<string, unknown> = {
      title: body.title,
      courseName: body.courseName,
      courseCode: body.courseCode || null,
      credits: body.credits,
      semester: body.semester,
      semesterType: body.semesterType,
      academicYear: body.academicYear,
      prerequisite: body.prerequisite || null,
      program: body.program,
      description: body.description ?? "",
      cpl: JSON.stringify(body.cpl ?? []),
      cpmk: JSON.stringify(body.cpmk ?? []),
      assessmentScheme: body.assessmentScheme ? JSON.stringify(body.assessmentScheme) : null,
      references: body.references ? JSON.stringify(body.references) : null,
      weeks: JSON.stringify(body.weeks ?? []),
      isPublished: body.isPublished ?? existing.isPublished,
      groupIds,
      updatedAt: now(),
    };

    if (body.fileUrl !== undefined) updateData.fileUrl = body.fileUrl || null;
    if (body.fileName !== undefined) updateData.fileName = body.fileName || null;
    if (body.fileType !== undefined) updateData.fileType = body.fileType || null;
    if (body.fileSize !== undefined) updateData.fileSize = body.fileSize || null;

    await db.rps.update(id, updateData);
    const updated = await db.rps.get(id) as RPS;
    return Response.json(updated);
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal mengupdate RPS" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireDosen(req);

    const existing = await db.rps.get(id) as RPS | null;
    if (!existing || existing.createdById !== session.userId) {
      return Response.json({ error: "RPS tidak ditemukan" }, { status: 404 });
    }

    await db.rps.delete(id);
    return Response.json({ success: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal menghapus RPS" }, { status: 500 });
  }
}
