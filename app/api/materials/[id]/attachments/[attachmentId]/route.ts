import { deleteFile } from "@/lib/cloudinary";
import { db } from "@/lib/db/firestore";
import { getSessionFromRequest } from "@/lib/auth";
import type { MaterialAttachment, Material } from "@/lib/db/types";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "DOSEN") {
    return Response.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const { id: materialId, attachmentId } = await params;

  const attachment = await db.materialAttachments.get(attachmentId) as MaterialAttachment | null;
  if (!attachment || attachment.materialId !== materialId) {
    return Response.json({ error: "Lampiran tidak ditemukan" }, { status: 404 });
  }

  const material = await db.materials.get(materialId) as Material | null;
  if (!material || material.createdById !== session.userId) {
    return Response.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  // storedName berisi Cloudinary public_id
  try {
    await deleteFile(attachment.storedName);
  } catch {
    // File may not exist in Cloudinary; continue with DB delete
  }

  await db.materialAttachments.delete(attachmentId);

  return Response.json({ success: true });
}
