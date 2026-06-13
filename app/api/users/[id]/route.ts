import { adminAuth } from "@/lib/firebase/admin";
import { db, now } from "@/lib/db/firestore";
import { requireDosen } from "@/lib/auth";
import { NextRequest } from "next/server";
import type { User } from "@/lib/db/types";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDosen(req);
    const { id } = await params;
    const body = await req.json();

    if (id === session.userId) {
      return Response.json({ error: "Tidak bisa mengubah akun sendiri" }, { status: 400 });
    }

    const firestoreData: Record<string, unknown> = { updatedAt: now() };
    if (typeof body.isBlocked === "boolean") {
      firestoreData.isBlocked = body.isBlocked;
    }

    if (typeof body.password === "string") {
      if (body.password.length < 6) {
        return Response.json({ error: "Password minimal 6 karakter" }, { status: 400 });
      }
      try {
        await adminAuth.updateUser(id, { password: body.password });
      } catch {
        return Response.json({ error: "Gagal mereset password" }, { status: 500 });
      }
    }

    if (Object.keys(firestoreData).length <= 1 && !body.password) {
      return Response.json({ error: "Tidak ada data yang diupdate" }, { status: 400 });
    }

    await db.users.update(id, firestoreData);

    const user = await db.users.get(id) as User | null;
    if (!user) return Response.json({ error: "User tidak ditemukan" }, { status: 404 });

    return Response.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal mengupdate pengguna" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDosen(req);
    const { id } = await params;

    if (id === session.userId) {
      return Response.json({ error: "Tidak bisa menghapus diri sendiri" }, { status: 400 });
    }

    await adminAuth.deleteUser(id);
    await db.users.delete(id);

    return Response.json({ success: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal menghapus pengguna" }, { status: 500 });
  }
}
