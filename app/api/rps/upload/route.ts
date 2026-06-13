import path from "path";
import { randomUUID } from "crypto";
import { uploadBuffer } from "@/lib/cloudinary";
import { requireDosen } from "@/lib/auth";

export const maxDuration = 60;

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};
const ALLOWED_EXTS = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];
const MAX_SIZE = 20 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    await requireDosen(req);
  } catch (e) {
    if (e instanceof Response) return e;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return Response.json({ error: "File tidak ditemukan atau kosong" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const mimeType = ALLOWED_TYPES[file.type];

    if (!ALLOWED_EXTS.includes(ext) && !mimeType) {
      return Response.json(
        { error: "Hanya file PDF, Word (.doc/.docx), dan Excel (.xls/.xlsx) yang diperbolehkan" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: "Ukuran file maksimal 20MB" }, { status: 400 });
    }

    const fileExt = ALLOWED_EXTS.includes(ext) ? ext : `.${mimeType}`;
    const fileType = fileExt.replace(".", "");
    const publicId = randomUUID();

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBuffer(buffer, "rps", publicId);

    return Response.json({
      url: result.secure_url,
      fileName: file.name,
      fileType,
      fileSize: file.size,
    });
  } catch (err) {
    console.error("[POST /api/rps/upload] error:", err);
    return Response.json({ error: "Gagal mengunggah file" }, { status: 500 });
  }
}
