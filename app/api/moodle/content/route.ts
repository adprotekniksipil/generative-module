import { db } from "@/lib/db/firestore";
import { NextRequest } from "next/server";
import type { Material, Quiz, RPS, Setting } from "@/lib/db/types";

async function validateApiKey(req: NextRequest): Promise<boolean> {
  const key = req.headers.get("x-api-key") ?? req.nextUrl.searchParams.get("apikey");
  const stored = await db.settings.get("moodle_api_key") as Setting | null;
  return !!stored && stored.value === key;
}

export async function GET(req: NextRequest) {
  if (!(await validateApiKey(req))) {
    return Response.json({ error: "Invalid API key" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "all";

  const [materials, quizzes, rpsList] = await Promise.all([
    (type === "all" || type === "materials")
      ? db.materials.list() as Promise<Material[]>
      : Promise.resolve([]),
    (type === "all" || type === "quizzes")
      ? db.quizzes.list() as Promise<Quiz[]>
      : Promise.resolve([]),
    (type === "all" || type === "rps")
      ? db.rps.list() as Promise<RPS[]>
      : Promise.resolve([]),
  ]);

  return Response.json({
    materials: (materials as Material[]).map((m) => ({
      id: m.id, title: m.title, topic: m.topic, subTopic: m.subTopic,
      difficulty: m.difficulty, createdAt: m.createdAt,
    })),
    quizzes: (quizzes as Quiz[]).map((q) => ({
      id: q.id, title: q.title, topic: q.topic,
      questionCount: q.questionCount, difficulty: q.difficulty, createdAt: q.createdAt,
    })),
    rps: (rpsList as RPS[]).map((r) => ({
      id: r.id, title: r.title, courseName: r.courseName,
      semester: r.semester, academicYear: r.academicYear, createdAt: r.createdAt,
    })),
  });
}
