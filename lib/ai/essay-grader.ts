import { generateObject } from "ai";
import { model } from "@/lib/ai/provider";
import { z } from "zod";
import { db } from "@/lib/db/firestore";
import { logAiUsage } from "@/lib/ai/usage-tracker";
import type { QuizAttempt, Quiz } from "@/lib/db/types";

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

export async function runAiGrading(attemptId: string) {
  const attempt = await db.quizAttempts.get(attemptId) as QuizAttempt | null;
  if (!attempt) return null;

  const quiz = await db.quizzes.get(attempt.quizId) as Quiz | null;
  if (!quiz) return null;

  const questions: QuizQuestion[] = JSON.parse(quiz.questions);
  const answers: Record<string, string> = JSON.parse(attempt.answers);

  const essayQuestions = questions.filter((q) => q.type === "essay");
  if (essayQuestions.length === 0) return null;

  const questionsForGrading = essayQuestions.map((q) => ({
    number: q.number,
    question: q.question,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    maxScore: q.points,
    studentAnswer: answers[q.number] ?? answers[String(q.number)] ?? "",
  }));

  const { object: aiResult, usage } = await generateObject({
    model,
    schema: z.object({
      grades: z.array(
        z.object({
          number: z.number(),
          score: z.number(),
          feedback: z.string(),
        })
      ),
    }),
    prompt: `Kamu adalah dosen teknik sipil yang sedang menilai jawaban esai mahasiswa.

Nilai setiap jawaban esai berikut berdasarkan kunci jawaban dan pembahasan yang diberikan.
Berikan skor (0 sampai maksimum poin) dan feedback singkat dalam Bahasa Indonesia.

Pertimbangkan:
- Kebenaran konsep dan teori
- Kelengkapan jawaban
- Penggunaan istilah teknis yang tepat
- Jika jawaban kosong, beri skor 0 dengan feedback "Tidak dijawab"

Soal dan Jawaban:
${questionsForGrading
  .map(
    (q) => `
---
Soal #${q.number} (Maks ${q.maxScore} poin):
${q.question}

Kunci Jawaban: ${q.correctAnswer}
Pembahasan: ${q.explanation ?? "-"}

Jawaban Mahasiswa: ${q.studentAnswer || "(kosong)"}
`
  )
  .join("\n")}`,
  });

  logAiUsage({
    userId: attempt.userId,
    action: "grade_essay",
    model: "gemini-3-flash-preview",
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    metadata: { attemptId, quizId: attempt.quizId },
  });

  const aiGrades: Record<number, EssayGrade> = {};
  for (const grade of aiResult.grades) {
    const q = essayQuestions.find((eq) => eq.number === grade.number);
    if (!q) continue;
    aiGrades[grade.number] = {
      score: Math.min(Math.max(0, grade.score), q.points),
      maxScore: q.points,
      feedback: grade.feedback,
      gradedBy: "ai",
    };
  }

  const existingGrades: Record<number, EssayGrade> = attempt.essayGrades
    ? JSON.parse(attempt.essayGrades)
    : {};

  const mergedGrades: Record<number, EssayGrade> = { ...aiGrades };
  for (const [qNum, grade] of Object.entries(existingGrades)) {
    if (grade.gradedBy === "manual") {
      mergedGrades[Number(qNum)] = grade;
    }
  }

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

  return { ...attempt, essayGrades: JSON.stringify(mergedGrades), score: totalScore };
}
