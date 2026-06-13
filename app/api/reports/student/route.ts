import { db } from "@/lib/db/firestore";
import { requireAuth } from "@/lib/auth";
import type { QuizAttempt, Quiz } from "@/lib/db/types";

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req);

    const attempts = await db.quizAttempts.list([
      { field: "userId", op: "==", value: session.userId },
    ]) as QuizAttempt[];

    const quizIds = [...new Set(attempts.map((a) => a.quizId))];
    const quizResults = await Promise.all(quizIds.map((id) => db.quizzes.get(id) as Promise<Quiz | null>));
    const quizMap = new Map(quizIds.map((id, i) => [id, quizResults[i]]));

    const enriched = attempts
      .map((a) => {
        const quiz = quizMap.get(a.quizId);
        if (!quiz) return null;
        return { ...a, quiz };
      })
      .filter(Boolean) as (QuizAttempt & { quiz: Quiz })[];

    const totalAttempts = enriched.length;
    const uniqueQuizzes = new Set(enriched.map((a) => a.quizId)).size;
    const scores = enriched.map((a) => (a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0));
    const avgScore = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const passRate = scores.length > 0 ? (scores.filter((s) => s >= 60).length / scores.length) * 100 : 0;

    const topicMap = new Map<string, number[]>();
    for (const a of enriched) {
      if (!topicMap.has(a.quiz.topic)) topicMap.set(a.quiz.topic, []);
      topicMap.get(a.quiz.topic)!.push(a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0);
    }
    const topicStats = Array.from(topicMap.entries()).map(([topic, ts]) => ({
      topic, attemptCount: ts.length,
      avgScore: Math.round((ts.reduce((s, v) => s + v, 0) / ts.length) * 10) / 10,
      passRate: Math.round((ts.filter((s) => s >= 60).length / ts.length) * 100 * 10) / 10,
    }));

    const recentAttempts = enriched.slice(0, 20).map((a) => ({
      id: a.id, quizId: a.quiz.id, quizTitle: a.quiz.title,
      topic: a.quiz.topic, subTopic: a.quiz.subTopic, difficulty: a.quiz.difficulty,
      questionType: a.quiz.questionType, score: a.score, totalPoints: a.totalPoints,
      percentage: a.totalPoints > 0 ? Math.round((a.score / a.totalPoints) * 100 * 10) / 10 : 0,
      completedAt: a.completedAt,
    }));

    const distribution = [0, 0, 0, 0, 0];
    for (const s of scores) distribution[Math.min(Math.floor(s / 20), 4)]++;

    const dailyMap = new Map<string, number[]>();
    for (const a of enriched) {
      if (!a.completedAt) continue;
      const date = new Date(a.completedAt).toISOString().split("T")[0];
      if (!dailyMap.has(date)) dailyMap.set(date, []);
      dailyMap.get(date)!.push(a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0);
    }
    const progressTimeline = Array.from(dailyMap.entries())
      .map(([date, ds]) => ({
        date, count: ds.length,
        avgScore: Math.round((ds.reduce((s, v) => s + v, 0) / ds.length) * 10) / 10,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return Response.json({
      overview: {
        totalAttempts, uniqueQuizzes,
        avgScore: Math.round(avgScore * 10) / 10,
        highestScore: Math.round(highestScore * 10) / 10,
        passRate: Math.round(passRate * 10) / 10,
      },
      topicStats, recentAttempts, distribution, progressTimeline,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal memuat evaluasi" }, { status: 500 });
  }
}
