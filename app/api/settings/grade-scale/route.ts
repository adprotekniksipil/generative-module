import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/firestore";
import { requireDosen } from "@/lib/auth";
import { DEFAULT_GRADE_SCALE } from "@/lib/constants/grade-scale";
import type { Setting } from "@/lib/db/types";

export async function GET() {
  const setting = await db.settings.get("grade_scale") as Setting | null;
  const scale = setting ? JSON.parse(setting.value) : DEFAULT_GRADE_SCALE;
  return NextResponse.json(scale);
}

export async function PUT(req: NextRequest) {
  try {
    await requireDosen(req);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scale: { letter: string; min: number }[] = await req.json();

  if (!Array.isArray(scale) || scale.some((s) => typeof s.letter !== "string" || typeof s.min !== "number")) {
    return NextResponse.json({ error: "Format tidak valid" }, { status: 400 });
  }

  await db.settings.set("grade_scale", JSON.stringify(scale));
  return NextResponse.json({ ok: true });
}
