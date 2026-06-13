import { requireDosen } from "@/lib/auth";
import { db } from "@/lib/db/firestore";

export async function GET(req: Request) {
  try { await requireDosen(req); } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const row = await db.settings.get("moodle_api_key");
  return Response.json({ apiKey: (row as { value?: string } | null)?.value ?? "" });
}

export async function POST(req: Request) {
  try { await requireDosen(req); } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { apiKey } = await req.json();
  if (!apiKey) return Response.json({ error: "apiKey wajib diisi" }, { status: 400 });

  await db.settings.set("moodle_api_key", apiKey);
  return Response.json({ ok: true });
}
