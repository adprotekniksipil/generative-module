import path from "path";
import { randomUUID } from "crypto";
import { uploadBuffer } from "@/lib/cloudinary";
import { db, now } from "@/lib/db/firestore";
import { requireAuth, getSessionFromRequest } from "@/lib/auth";
import type { Material } from "@/lib/db/types";

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};
const ALLOWED_EXTS = [".pdf", ".ppt", ".pptx"];
const MAX_SIZE = 20 * 1024 * 1024;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
  } catch (e) {
    if (e instanceof Response) return e;
  }

  const { id: materialId } = await params;
  const attachments = await db.materialAttachments.list([
    { field: "materialId", op: "==", value: materialId },
  ]);

  return Response.json(attachments);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return Response.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    if (session.role !== "DOSEN") {
      return Response.json({ error: "Hanya dosen yang dapat menambah lampiran" }, { status: 403 });
    }

    const { id: materialId } = await params;

    const material = await db.materials.get(materialId) as Material | null;
    if (!material) {
      return Response.json({ error: "Materi tidak ditemukan" }, { status: 404 });
    }
    if (material.createdById !== session.userId) {
      return Response.json({ error: "Tidak diizinkan" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sectionIndex = Number(formData.get("sectionIndex") ?? 0);
    const sectionHeading = String(formData.get("sectionHeading") ?? "");

    if (!file || file.size === 0) {
      return Response.json({ error: "File tidak ditemukan atau kosong" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const mimeType = ALLOWED_TYPES[file.type];
    if (!ALLOWED_EXTS.includes(ext) && !mimeType) {
      return Response.json({ error: "Hanya file PDF, PPT, dan PPTX yang diperbolehkan" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: "Ukuran file maksimal 20MB" }, { status: 400 });
    }

    const fileExt = ALLOWED_EXTS.includes(ext) ? ext : `.${mimeType}`;
    const fileType = fileExt.replace(".", "") as "pdf" | "ppt" | "pptx";
    const publicId = randomUUID();
    const folder = `attachments/${materialId}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBuffer(buffer, folder, publicId);

    // storedName menyimpan Cloudinary public_id untuk keperluan delete
    const cloudinaryPublicId = result.public_id;

    const attachment = await db.materialAttachments.create({
      materialId,
      sectionIndex,
      sectionHeading,
      filename: file.name,
      storedName: cloudinaryPublicId,
      fileType,
      fileSize: file.size,
      url: result.secure_url,
      createdAt: now(),
    });

    return Response.json(attachment, { status: 201 });
  } catch (err) {
    console.error("[POST /attachments] error:", err);
    return Response.json({ error: "Terjadi kesalahan server saat mengunggah file" }, { status: 500 });
  }
}
