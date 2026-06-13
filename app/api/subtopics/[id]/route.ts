import { db, now } from "@/lib/db/firestore";
import { requireDosen } from "@/lib/auth";

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
      return Response.json({ error: "Nama sub-topik wajib diisi" }, { status: 400 });
    }

    await db.subtopics.update(id, { label: label.trim(), updatedAt: now() });
    const subtopic = await db.subtopics.get(id);

    return Response.json(subtopic);
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal mengupdate sub-topik" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireDosen(req);
    const { id } = await params;

    await db.subtopics.delete(id);
    return Response.json({ success: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal menghapus sub-topik" }, { status: 500 });
  }
}
