import { db, now } from "@/lib/db/firestore";
import { getSessionFromRequest, requireDosen } from "@/lib/auth";
import type { Material, GroupMember } from "@/lib/db/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);

  const material = await db.materials.get(id) as Material | null;
  if (!material) {
    return Response.json({ error: "Materi tidak ditemukan" }, { status: 404 });
  }

  if (session?.role === "DOSEN" && material.createdById === session.userId) {
    return Response.json(material);
  }

  if (session?.role === "MAHASISWA" && material.isPublished) {
    const memberships = await db.groupMembers.list([
      { field: "userId", op: "==", value: session.userId },
    ]) as GroupMember[];
    const userGroupIds = new Set(memberships.map((m) => m.groupId));
    const hasAccess = material.groupIds.some((gid) => userGroupIds.has(gid));
    if (hasAccess) return Response.json(material);
  }

  return Response.json({ error: "Materi tidak ditemukan" }, { status: 404 });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDosen(req);
    const { id } = await params;
    const body = await req.json();

    const existing = await db.materials.get(id) as Material | null;
    if (!existing || existing.createdById !== session.userId) {
      return Response.json({ error: "Materi tidak ditemukan" }, { status: 404 });
    }

    const updateData: Partial<Material> & Record<string, unknown> = { updatedAt: now() };

    if (body.title) updateData.title = body.title;
    if (body.content) {
      updateData.content = body.content;
      updateData.wordCount = body.content.split(/\s+/).filter(Boolean).length;
    }
    if (body.summary !== undefined) updateData.summary = body.summary;
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;
    if (body.groupIds !== undefined) updateData.groupIds = body.groupIds;

    await db.materials.update(id, updateData);

    const updated = await db.materials.get(id) as Material;
    return Response.json(updated);
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal mengupdate materi" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDosen(req);
    const { id } = await params;

    const existing = await db.materials.get(id) as Material | null;
    if (!existing || existing.createdById !== session.userId) {
      return Response.json({ error: "Materi tidak ditemukan" }, { status: 404 });
    }

    await db.materialAttachments.deleteByMaterial(id);
    await db.materials.delete(id);
    return Response.json({ success: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal menghapus materi" }, { status: 500 });
  }
}
