import { db } from "@/lib/db/firestore";
import { requireDosen } from "@/lib/auth";
import type { Quiz, QuizAttempt } from "@/lib/db/types";

export async function GET(req: Request) {
  try {
    await requireDosen(req);

    const quizzes = await db.quizzes.list() as Quiz[];

    const essayQuizIds: string[] = [];
    for (const quiz of quizzes) {
      const questions = JSON.parse(quiz.questions);
      if (questions.some((q: { type: string }) => q.type === "essay")) {
        essayQuizIds.push(quiz.id);
      }
    }

    if (essayQuizIds.length === 0) {
      return Response.json({ count: 0 });
    }

    // Fetch attempts for essay quizzes
    const attemptsPerQuiz = await Promise.all(
      essayQuizIds.map((qid) =>
        db.quizAttempts.list([{ field: "quizId", op: "==", value: qid }])
      )
    );
    const attempts = attemptsPerQuiz.flat() as QuizAttempt[];

    const quizMap = new Map(quizzes.map((q) => [q.id, q]));
    let pendingCount = 0;

    for (const attempt of attempts) {
      const quiz = quizMap.get(attempt.quizId);
      if (!quiz) continue;
      const questions = JSON.parse(quiz.questions);
      const essayCount = questions.filter((q: { type: string }) => q.type === "essay").length;
      const grades = attempt.essayGrades ? JSON.parse(attempt.essayGrades) : {};
      const gradedCount = Object.keys(grades).length;
      if (gradedCount < essayCount) pendingCount++;
    }

    return Response.json({ count: pendingCount });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ count: 0 });
  }
}
