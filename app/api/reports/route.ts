import { db } from "@/lib/db/firestore";
import { requireDosen } from "@/lib/auth";
import type { QuizAttempt, Quiz, User, GroupMember } from "@/lib/db/types";

export async function GET(req: Request) {
  try {
    await requireDosen(req);

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    let attempts: QuizAttempt[];

    if (groupId) {
      const members = await db.groupMembers.list([
        { field: "groupId", op: "==", value: groupId },
      ]) as GroupMember[];
      const userIds = members.map((m) => m.userId);

      if (userIds.length === 0) {
        return Response.json({
          overview: { totalAttempts: 0, uniqueStudents: 0, uniqueQuizzes: 0, avgScore: 0, passRate: 0 },
          quizStats: [], studentStats: [], distribution: [0, 0, 0, 0, 0], topicStats: [],
        });
      }

      const attemptsPerUser = await Promise.all(
        userIds.map((uid) =>
          db.quizAttempts.list([{ field: "userId", op: "==", value: uid }]) as Promise<QuizAttempt[]>
        )
      );
      attempts = attemptsPerUser.flat();
    } else {
      attempts = await db.quizAttempts.list() as QuizAttempt[];
    }

    // Enrich with quiz and user data
    const quizIds = [...new Set(attempts.map((a) => a.quizId))];
    const userIds = [...new Set(attempts.map((a) => a.userId))];

    const [quizResults, userResults] = await Promise.all([
      Promise.all(quizIds.map((id) => db.quizzes.get(id) as Promise<Quiz | null>)),
      Promise.all(userIds.map((id) => db.users.get(id) as Promise<User | null>)),
    ]);

    const quizMap = new Map(quizIds.map((id, i) => [id, quizResults[i]]));
    const userMap = new Map(userIds.map((id, i) => [id, userResults[i]]));

    const enriched = attempts
      .map((a) => {
        const quiz = quizMap.get(a.quizId);
        const user = userMap.get(a.userId);
        if (!quiz || !user) return null;
        return { ...a, quiz, user };
      })
      .filter(Boolean) as (QuizAttempt & { quiz: Quiz; user: User })[];

    const totalAttempts = enriched.length;
    const uniqueStudents = new Set(enriched.map((a) => a.userId)).size;
    const uniqueQuizzes = new Set(enriched.map((a) => a.quizId)).size;

    const avgScore =
      totalAttempts > 0
        ? enriched.reduce((sum, a) => sum + (a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0), 0) / totalAttempts
        : 0;
    const passCount = enriched.filter((a) => a.totalPoints > 0 && (a.score / a.totalPoints) * 100 >= 60).length;
    const passRate = totalAttempts > 0 ? (passCount / totalAttempts) * 100 : 0;

    // Per-quiz stats
    const quizStatMap = new Map<string, { quiz: Quiz; attempts: typeof enriched }>();
    for (const a of enriched) {
      if (!quizStatMap.has(a.quizId)) quizStatMap.set(a.quizId, { quiz: a.quiz, attempts: [] });
      quizStatMap.get(a.quizId)!.attempts.push(a);
    }
    const quizStats = Array.from(quizStatMap.values()).map(({ quiz, attempts: qa }) => {
      const scores = qa.map((a) => (a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0));
      const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
      return {
        quizId: quiz.id, title: quiz.title, topic: quiz.topic, subTopic: quiz.subTopic,
        difficulty: quiz.difficulty, questionCount: quiz.questionCount, questionType: quiz.questionType,
        attemptCount: qa.length, uniqueStudents: new Set(qa.map((a) => a.userId)).size,
        avgScore: Math.round(avg * 10) / 10, highestScore: Math.round(Math.max(...scores) * 10) / 10,
        lowestScore: Math.round(Math.min(...scores) * 10) / 10,
        passRate: Math.round((scores.filter((s) => s >= 60).length / scores.length) * 100 * 10) / 10,
      };
    });

    // Per-student stats
    const studentStatMap = new Map<string, { user: User; attempts: typeof enriched }>();
    for (const a of enriched) {
      if (!studentStatMap.has(a.userId)) studentStatMap.set(a.userId, { user: a.user, attempts: [] });
      studentStatMap.get(a.userId)!.attempts.push(a);
    }
    const studentStats = Array.from(studentStatMap.values()).map(({ user, attempts: sa }) => {
      const scores = sa.map((a) => (a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0));
      const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
      return {
        userId: user.id, name: user.name, nim: user.nim ?? null, email: user.email,
        attemptCount: sa.length, avgScore: Math.round(avg * 10) / 10,
        passRate: Math.round((scores.filter((s) => s >= 60).length / scores.length) * 100 * 10) / 10,
        lastAttempt: sa[0]?.completedAt,
      };
    });

    const distribution = [0, 0, 0, 0, 0];
    for (const a of enriched) {
      const pct = a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0;
      distribution[Math.min(Math.floor(pct / 20), 4)]++;
    }

    const topicMap = new Map<string, number[]>();
    for (const a of enriched) {
      if (!topicMap.has(a.quiz.topic)) topicMap.set(a.quiz.topic, []);
      topicMap.get(a.quiz.topic)!.push(a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0);
    }
    const topicStats = Array.from(topicMap.entries()).map(([topic, scores]) => ({
      topic, attemptCount: scores.length,
      avgScore: Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10,
    }));

    return Response.json({
      overview: {
        totalAttempts, uniqueStudents, uniqueQuizzes,
        avgScore: Math.round(avgScore * 10) / 10,
        passRate: Math.round(passRate * 10) / 10,
      },
      quizStats, studentStats, distribution, topicStats,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal memuat laporan" }, { status: 500 });
  }
}
