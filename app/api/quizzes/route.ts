import { db, now } from "@/lib/db/firestore";
import { getSessionFromRequest, requireDosen } from "@/lib/auth";
import { NextRequest } from "next/server";
import type { Quiz, GroupMember } from "@/lib/db/types";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const searchParams = req.nextUrl.searchParams;
    const topic = searchParams.get("topic");
    const difficulty = searchParams.get("difficulty");

    if (session?.role === "DOSEN") {
      const where: Parameters<typeof db.quizzes.list>[0] = [
        { field: "createdById", op: "==", value: session.userId },
      ];
      if (topic) where.push({ field: "topic", op: "==", value: topic });
      if (difficulty) where.push({ field: "difficulty", op: "==", value: difficulty });

      const quizzes = await db.quizzes.list(where) as Quiz[];
      return Response.json(
        quizzes.map((q) => ({
          id: q.id, title: q.title, topic: q.topic, subTopic: q.subTopic,
          language: q.language, difficulty: q.difficulty, examType: q.examType,
          safeMode: q.safeMode, questionCount: q.questionCount, questionType: q.questionType,
          totalPoints: q.totalPoints, isPublished: q.isPublished, createdAt: q.createdAt,
          groupIds: q.groupIds,
        }))
      );
    }

    if (session?.role === "MAHASISWA") {
      const memberships = await db.groupMembers.list([
        { field: "userId", op: "==", value: session.userId },
      ]) as GroupMember[];

      if (memberships.length === 0) return Response.json([]);

      const userGroupIds = memberships.map((m) => m.groupId);
      const where: Parameters<typeof db.quizzes.list>[0] = [
        { field: "isPublished", op: "==", value: true },
        { field: "groupIds", op: "array-contains-any", value: userGroupIds.slice(0, 30) },
      ];
      if (topic) where.push({ field: "topic", op: "==", value: topic });
      if (difficulty) where.push({ field: "difficulty", op: "==", value: difficulty });

      const quizzes = await db.quizzes.list(where) as Quiz[];
      return Response.json(
        quizzes.map((q) => ({
          id: q.id, title: q.title, topic: q.topic, subTopic: q.subTopic,
          language: q.language, difficulty: q.difficulty, examType: q.examType,
          safeMode: q.safeMode, questionCount: q.questionCount, questionType: q.questionType,
          totalPoints: q.totalPoints, createdAt: q.createdAt,
        }))
      );
    }

    return Response.json([]);
  } catch (err) {
    console.error("[GET /api/quizzes] error:", err);
    return Response.json({ error: "Gagal mengambil data kuis" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireDosen(req);
    const body = await req.json();

    const questions = body.questions;
    const totalPoints = Array.isArray(questions)
      ? questions.reduce((sum: number, q: { points?: number }) => sum + (q.points ?? 0), 0)
      : 0;

    const timestamp = now();
    const quiz = await db.quizzes.create({
      title: body.title,
      topic: body.topic,
      subTopic: body.subTopic,
      language: body.language ?? "id",
      difficulty: body.difficulty,
      examType: body.examType ?? "Quiz",
      safeMode: body.safeMode ?? false,
      questionCount: body.questionCount ?? questions.length,
      questionType: body.questionType ?? "mixed",
      questions: JSON.stringify(questions),
      totalPoints,
      modelUsed: body.modelUsed ?? "gemini-3-flash-preview",
      tokensUsed: body.tokensUsed ?? 0,
      createdById: session.userId,
      isPublished: body.isPublished ?? false,
      essayGradingMode: body.essayGradingMode ?? "manual",
      groupIds: body.groupIds ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return Response.json(quiz, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal menyimpan kuis" }, { status: 500 });
  }
}
