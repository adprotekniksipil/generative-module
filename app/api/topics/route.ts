import { db, now } from "@/lib/db/firestore";
import { getSessionFromRequest, requireDosen } from "@/lib/auth";
import type { Topic, SubTopic } from "@/lib/db/types";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawTopics = await db.topics.list() as Topic[];
  const topics = rawTopics.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const topicsWithSubtopics = await Promise.all(
    topics.map(async (t) => {
      const rawSubtopics = await db.subtopics.list([
        { field: "topicId", op: "==", value: t.id },
      ]) as SubTopic[];
      const subtopics = rawSubtopics.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      return { ...t, subtopics };
    })
  );

  return Response.json(topicsWithSubtopics);
}

export async function POST(req: Request) {
  try {
    await requireDosen(req);
    const body = await req.json();
    const { label } = body;

    if (!label?.trim()) {
      return Response.json({ error: "Nama bidang wajib diisi" }, { status: 400 });
    }

    const slug = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_");

    const existingTopics = await db.topics.list([
      { field: "slug", op: "==", value: slug },
    ]) as Topic[];
    if (existingTopics.length > 0) {
      return Response.json({ error: "Bidang dengan nama serupa sudah ada" }, { status: 409 });
    }

    const allTopics = await db.topics.list() as Topic[];
    const maxOrder = allTopics.reduce((max, t) => Math.max(max, t.sortOrder ?? 0), -1);

    const timestamp = now();
    const topic = await db.topics.create({
      slug,
      label: label.trim(),
      sortOrder: maxOrder + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return Response.json({ ...topic, subtopics: [] }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal membuat bidang" }, { status: 500 });
  }
}
