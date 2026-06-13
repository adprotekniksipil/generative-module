import { db, now } from "@/lib/db/firestore";
import { requireDosen } from "@/lib/auth";
import type { Topic, SubTopic } from "@/lib/db/types";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireDosen(req);
    const { id } = await params;
    const body = await req.json();
    const { label } = body;

    if (!label?.trim()) {
      return Response.json({ error: "Nama bidang wajib diisi" }, { status: 400 });
    }

    await db.topics.update(id, { label: label.trim(), updatedAt: now() });

    const topic = await db.topics.get(id) as Topic | null;
    const subtopics = await db.subtopics.list([
      { field: "topicId", op: "==", value: id },
    ]) as SubTopic[];

    return Response.json({ ...topic, subtopics });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal mengupdate bidang" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireDosen(req);
    const { id } = await params;

    await db.topics.delete(id);
    return Response.json({ success: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal menghapus bidang" }, { status: 500 });
  }
}
