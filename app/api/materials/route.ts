import { db, now } from "@/lib/db/firestore";
import { getSessionFromRequest, requireDosen } from "@/lib/auth";
import { NextRequest } from "next/server";
import type { Material, GroupMember } from "@/lib/db/types";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const searchParams = req.nextUrl.searchParams;
  const topic = searchParams.get("topic");
  const difficulty = searchParams.get("difficulty");

  if (session?.role === "DOSEN") {
    const where: Parameters<typeof db.materials.list>[0] = [
      { field: "createdById", op: "==", value: session.userId },
    ];
    if (topic) where.push({ field: "topic", op: "==", value: topic });
    if (difficulty) where.push({ field: "difficulty", op: "==", value: difficulty });

    const materials = await db.materials.list(where) as Material[];
    return Response.json(
      materials.map((m) => ({
        id: m.id, title: m.title, topic: m.topic, subTopic: m.subTopic,
        language: m.language, difficulty: m.difficulty, depth: m.depth,
        sourceType: m.sourceType, wordCount: m.wordCount, isPublished: m.isPublished,
        createdAt: m.createdAt, groupIds: m.groupIds,
      }))
    );
  }

  if (session?.role === "MAHASISWA") {
    const memberships = await db.groupMembers.list([
      { field: "userId", op: "==", value: session.userId },
    ]) as GroupMember[];

    if (memberships.length === 0) return Response.json([]);

    const userGroupIds = memberships.map((m) => m.groupId);
    const where: Parameters<typeof db.materials.list>[0] = [
      { field: "isPublished", op: "==", value: true },
      { field: "groupIds", op: "array-contains-any", value: userGroupIds.slice(0, 30) },
    ];
    if (topic) where.push({ field: "topic", op: "==", value: topic });
    if (difficulty) where.push({ field: "difficulty", op: "==", value: difficulty });

    const materials = await db.materials.list(where) as Material[];
    return Response.json(
      materials.map((m) => ({
        id: m.id, title: m.title, topic: m.topic, subTopic: m.subTopic,
        language: m.language, difficulty: m.difficulty, depth: m.depth,
        sourceType: m.sourceType, wordCount: m.wordCount, createdAt: m.createdAt,
      }))
    );
  }

  return Response.json([]);
}

export async function POST(req: Request) {
  try {
    const session = await requireDosen(req);
    const body = await req.json();

    const wordCount = body.content
      ? body.content.split(/\s+/).filter(Boolean).length
      : 0;

    const timestamp = now();
    const material = await db.materials.create({
      title: body.title,
      topic: body.topic,
      subTopic: body.subTopic,
      language: body.language ?? "id",
      difficulty: body.difficulty,
      depth: body.depth ?? "standard",
      content: body.content,
      summary: body.summary ?? null,
      objectives: body.objectives ? JSON.stringify(body.objectives) : null,
      sourceType: body.sourceType ?? "topic",
      sourceContent: body.sourceContent ?? null,
      sourceUrl: body.sourceUrl ?? null,
      wordCount,
      modelUsed: body.modelUsed ?? "gemini-3-flash-preview",
      tokensUsed: body.tokensUsed ?? 0,
      createdById: session.userId,
      isPublished: body.isPublished ?? false,
      groupIds: body.groupIds ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return Response.json(material, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal menyimpan materi" }, { status: 500 });
  }
}
