import { db, now } from "@/lib/db/firestore";
import { getSessionFromRequest, requireDosen } from "@/lib/auth";
import type { Quiz, GroupMember } from "@/lib/db/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);

  const quiz = await db.quizzes.get(id) as Quiz | null;
  if (!quiz) {
    return Response.json({ error: "Kuis tidak ditemukan" }, { status: 404 });
  }

  if (session?.role === "DOSEN" && quiz.createdById === session.userId) {
    return Response.json({ ...quiz, questions: JSON.parse(quiz.questions) });
  }

  if (session?.role === "MAHASISWA" && quiz.isPublished) {
    const memberships = await db.groupMembers.list([
      { field: "userId", op: "==", value: session.userId },
    ]) as GroupMember[];
    const userGroupIds = new Set(memberships.map((m) => m.groupId));
    const hasAccess = quiz.groupIds.some((gid) => userGroupIds.has(gid));
    if (hasAccess) {
      return Response.json({ ...quiz, questions: JSON.parse(quiz.questions) });
    }
  }

  return Response.json({ error: "Kuis tidak ditemukan" }, { status: 404 });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDosen(req);
    const { id } = await params;
    const body = await req.json();

    const existing = await db.quizzes.get(id) as Quiz | null;
    if (!existing || existing.createdById !== session.userId) {
      return Response.json({ error: "Kuis tidak ditemukan" }, { status: 404 });
    }

    const updateData: Partial<Quiz> & Record<string, unknown> = { updatedAt: now() };

    if (body.title) updateData.title = body.title;
    if (body.questions) {
      updateData.questions = JSON.stringify(body.questions);
      updateData.questionCount = body.questions.length;
      updateData.totalPoints = body.questions.reduce(
        (sum: number, q: { points?: number }) => sum + (q.points ?? 0), 0
      );
    }
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;
    if (body.essayGradingMode !== undefined) updateData.essayGradingMode = body.essayGradingMode;
    if (body.examType !== undefined) updateData.examType = body.examType;
    if (body.safeMode !== undefined) updateData.safeMode = body.safeMode;
    if (body.groupIds !== undefined) updateData.groupIds = body.groupIds;

    await db.quizzes.update(id, updateData);
    const updated = await db.quizzes.get(id) as Quiz;
    return Response.json(updated);
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal mengupdate kuis" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDosen(req);
    const { id } = await params;

    const existing = await db.quizzes.get(id) as Quiz | null;
    if (!existing || existing.createdById !== session.userId) {
      return Response.json({ error: "Kuis tidak ditemukan" }, { status: 404 });
    }

    await db.quizzes.delete(id);
    return Response.json({ success: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal menghapus kuis" }, { status: 500 });
  }
}
