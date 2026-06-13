import { db } from "@/lib/db/firestore";
import { requireDosen } from "@/lib/auth";
import type { QuizAttempt, Quiz, User } from "@/lib/db/types";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireDosen(req);
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await db.users.get(id) as User | null;
  if (!user) {
    return Response.json({ error: "Mahasiswa tidak ditemukan" }, { status: 404 });
  }

  const attempts = await db.quizAttempts.list([
    { field: "userId", op: "==", value: id },
  ]) as QuizAttempt[];

  const quizIds = [...new Set(attempts.map((a) => a.quizId))];
  const quizResults = await Promise.all(quizIds.map((qid) => db.quizzes.get(qid) as Promise<Quiz | null>));
  const quizMap = new Map(quizIds.map((qid, i) => [qid, quizResults[i]]));

  const attemptList = attempts
    .map((a) => {
      const quiz = quizMap.get(a.quizId);
      if (!quiz) return null;
      const pct = a.totalPoints > 0 ? Math.round((a.score / a.totalPoints) * 1000) / 10 : 0;
      return {
        id: a.id,
        quizId: quiz.id,
        quizTitle: quiz.title,
        topic: quiz.topic,
        subTopic: quiz.subTopic,
        difficulty: quiz.difficulty,
        score: a.score,
        totalPoints: a.totalPoints,
        percentage: pct,
        passed: pct >= 60,
        completedAt: a.completedAt,
      };
    })
    .filter(Boolean);

  return Response.json({
    user: { id: user.id, name: user.name, email: user.email, nim: user.nim },
    attempts: attemptList,
  });
}
