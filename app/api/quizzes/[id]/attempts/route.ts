import { db, now, getDocs, COL } from "@/lib/db/firestore";
import { requireAuth } from "@/lib/auth";
import { runAiGrading } from "@/lib/ai/essay-grader";
import type { Quiz, QuizAttempt, User } from "@/lib/db/types";

interface QuizQuestion {
  number: number;
  question: string;
  type: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    const body = await req.json();
    const { answers, locked, violationCount } = body;

    const quiz = await db.quizzes.get(id) as Quiz | null;
    if (!quiz) {
      return Response.json({ error: "Kuis tidak ditemukan" }, { status: 404 });
    }

    const questions: QuizQuestion[] = JSON.parse(quiz.questions);
    const totalPoints = questions.reduce((sum, q) => sum + (q.points ?? 0), 0);

    if (locked) {
      const incomplete = await getDocs<QuizAttempt>(COL.QUIZ_ATTEMPTS, [
        { field: "quizId", op: "==", value: id },
        { field: "userId", op: "==", value: session.userId },
        { field: "completedAt", op: "==", value: null },
      ]);

      // Delete duplicates, keep oldest
      if (incomplete.length > 1) {
        await Promise.all(incomplete.slice(1).map((a) => {
          return import("@/lib/db/firestore").then(({ deleteDoc, COL }) =>
            deleteDoc(COL.QUIZ_ATTEMPTS, a.id)
          );
        }));
      }

      if (incomplete.length > 0) {
        await db.quizAttempts.update(incomplete[0].id, {
          answers: JSON.stringify(answers),
          violationCount: violationCount ?? 0,
          lockedAt: now(),
        });
        return Response.json({ ...incomplete[0], answers: JSON.stringify(answers) }, { status: 200 });
      }

      const attempt = await db.quizAttempts.create({
        quizId: id,
        userId: session.userId,
        answers: JSON.stringify(answers),
        score: 0,
        totalPoints,
        violationCount: violationCount ?? 0,
        lockedAt: now(),
        startedAt: now(),
        completedAt: null,
        essayGrades: null,
      });
      return Response.json(attempt, { status: 201 });
    }

    let score = 0;
    for (const q of questions) {
      const userAnswer = (answers[q.number] ?? answers[String(q.number)])?.toString().trim().toLowerCase();
      const correctAnswer = q.correctAnswer?.toString().trim().toLowerCase();
      if ((q.type === "multiple_choice" || q.type === "true_false") && userAnswer === correctAnswer) {
        score += q.points ?? 0;
      }
    }

    const attempt = await db.quizAttempts.create({
      quizId: id,
      userId: session.userId,
      answers: JSON.stringify(answers),
      score,
      totalPoints,
      essayGrades: null,
      violationCount: 0,
      lockedAt: null,
      startedAt: now(),
      completedAt: now(),
    });

    const hasEssay = questions.some((q) => q.type === "essay");
    if (hasEssay && quiz.essayGradingMode === "ai_auto") {
      runAiGrading(attempt.id).catch((err) => {
        console.error("Auto AI grading failed for attempt", attempt.id, err);
      });
    }

    return Response.json(attempt, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal menyimpan jawaban" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    if (session.role === "DOSEN") {
      const attempts = await db.quizAttempts.list([
        { field: "quizId", op: "==", value: id },
      ]) as QuizAttempt[];

      const withUsers = await Promise.all(
        attempts.map(async (a) => {
          const user = await db.users.get(a.userId) as User | null;
          return {
            ...a,
            user: user ? { id: user.id, name: user.name, email: user.email } : null,
          };
        })
      );
      return Response.json(withUsers);
    }

    const attempts = await db.quizAttempts.list([
      { field: "quizId", op: "==", value: id },
      { field: "userId", op: "==", value: session.userId },
    ]) as QuizAttempt[];

    return Response.json(attempts);
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal memuat riwayat" }, { status: 500 });
  }
}
