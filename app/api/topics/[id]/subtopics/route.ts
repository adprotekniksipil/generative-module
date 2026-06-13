import { db, now } from "@/lib/db/firestore";
import { requireDosen } from "@/lib/auth";
import type { Topic, SubTopic } from "@/lib/db/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireDosen(req);
    const { id: topicId } = await params;
    const body = await req.json();
    const { label } = body;

    if (!label?.trim()) {
      return Response.json({ error: "Nama sub-topik wajib diisi" }, { status: 400 });
    }

    const topic = await db.topics.get(topicId) as Topic | null;
    if (!topic) {
      return Response.json({ error: "Bidang tidak ditemukan" }, { status: 404 });
    }

    const slug = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_");

    const existing = await db.subtopics.list([
      { field: "topicId", op: "==", value: topicId },
      { field: "slug", op: "==", value: slug },
    ]) as SubTopic[];
    if (existing.length > 0) {
      return Response.json({ error: "Sub-topik dengan nama serupa sudah ada di bidang ini" }, { status: 409 });
    }

    const subtopicsInTopic = await db.subtopics.list([
      { field: "topicId", op: "==", value: topicId },
    ]) as SubTopic[];
    const maxOrder = subtopicsInTopic.reduce((max, s) => Math.max(max, s.sortOrder ?? 0), -1);

    const timestamp = now();
    const subtopic = await db.subtopics.create({
      slug,
      label: label.trim(),
      topicId,
      sortOrder: maxOrder + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return Response.json(subtopic, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal membuat sub-topik" }, { status: 500 });
  }
}
