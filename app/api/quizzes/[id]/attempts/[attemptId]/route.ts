import { db, now } from "@/lib/db/firestore";
import { requireDosen } from "@/lib/auth";
import { runAiGrading } from "@/lib/ai/essay-grader";
import type { QuizAttempt, Quiz, User } from "@/lib/db/types";

interface QuizQuestion {
  number: number;
  question: string;
  type: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

interface EssayGrade {
  score: number;
  maxScore: number;
  feedback: string;
  gradedBy: "manual" | "ai";
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  try {
    await requireDosen(req);
    const { attemptId } = await params;
    const body = await req.json();

    if (body.unlock === true) {
      await db.quizAttempts.update(attemptId, { lockedAt: null });
      const updated = await db.quizAttempts.get(attemptId) as QuizAttempt | null;
      if (!updated) return Response.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
      const user = await db.users.get(updated.userId) as User | null;
      return Response.json({
        ...updated,
        user: user ? { id: user.id, name: user.name, email: user.email } : null,
      });
    }

    const { essayGrades } = body as {
      essayGrades: Record<number, { score: number; maxScore: number; feedback: string }>;
    };

    const attempt = await db.quizAttempts.get(attemptId) as QuizAttempt | null;
    if (!attempt) {
      return Response.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
    }

    const quiz = await db.quizzes.get(attempt.quizId) as Quiz | null;
    if (!quiz) {
      return Response.json({ error: "Kuis tidak ditemukan" }, { status: 404 });
    }

    const existingGrades: Record<number, EssayGrade> = attempt.essayGrades
      ? JSON.parse(attempt.essayGrades)
      : {};

    const mergedGrades: Record<number, EssayGrade> = { ...existingGrades };
    for (const [qNum, grade] of Object.entries(essayGrades)) {
      mergedGrades[Number(qNum)] = {
        score: grade.score,
        maxScore: grade.maxScore,
        feedback: grade.feedback,
        gradedBy: "manual",
      };
    }

    const questions: QuizQuestion[] = JSON.parse(quiz.questions);
    const answers: Record<string, string> = JSON.parse(attempt.answers);
    let totalScore = 0;

    for (const q of questions) {
      if (q.type === "multiple_choice" || q.type === "true_false") {
        const userAnswer = (answers[q.number] ?? answers[String(q.number)])?.toString().trim().toLowerCase();
        const correctAnswer = q.correctAnswer?.toString().trim().toLowerCase();
        if (userAnswer === correctAnswer) totalScore += q.points ?? 0;
      } else if (q.type === "essay") {
        const grade = mergedGrades[q.number] ?? mergedGrades[String(q.number) as unknown as number];
        if (grade) totalScore += grade.score;
      }
    }

    await db.quizAttempts.update(attemptId, {
      essayGrades: JSON.stringify(mergedGrades),
      score: totalScore,
    });

    const updated = await db.quizAttempts.get(attemptId) as QuizAttempt;
    const user = await db.users.get(updated.userId) as User | null;
    return Response.json({
      ...updated,
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("Manual grading error:", e);
    return Response.json({ error: "Gagal menyimpan penilaian", detail: String(e) }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  try {
    await requireDosen(req);
    const { attemptId } = await params;

    const updated = await runAiGrading(attemptId);
    if (!updated) {
      return Response.json({ error: "Attempt tidak ditemukan atau tidak ada soal esai" }, { status: 404 });
    }

    const result = await db.quizAttempts.get(attemptId) as QuizAttempt;
    const user = await db.users.get(result.userId) as User | null;
    return Response.json({
      ...result,
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("AI grading error:", e);
    return Response.json({ error: "Gagal melakukan penilaian AI" }, { status: 500 });
  }
}
