import { adminAuth } from "@/lib/firebase/admin";
import { db, now } from "@/lib/db/firestore";
import { getSession } from "@/lib/auth";
import type { User } from "@/lib/db/types";

export async function PUT(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, nim, email, newPassword } = await req.json();

    const currentUser = await db.users.get(session.userId) as User | null;
    if (!currentUser) {
      return Response.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // ─── Ganti Password ──────────────────────────────────
    if (newPassword) {
      if (newPassword.length < 6) {
        return Response.json({ error: "Password baru minimal 6 karakter" }, { status: 400 });
      }
      await adminAuth.updateUser(session.userId, { password: newPassword });
      return Response.json({ success: true, message: "Password berhasil diubah" });
    }

    // ─── Update Profil ───────────────────────────────────
    if (!name?.trim()) {
      return Response.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
    }

    if (email && email !== currentUser.email) {
      const existingEmail = await db.users.findByEmail(email);
      if (existingEmail) {
        return Response.json({ error: "Email sudah digunakan" }, { status: 409 });
      }
      await adminAuth.updateUser(session.userId, { email });
    }

    if (nim && nim !== currentUser.nim) {
      const existingNim = await db.users.findByNim(nim);
      if (existingNim) {
        return Response.json({ error: "NIM sudah digunakan" }, { status: 409 });
      }
    }

    const updateData: Partial<User> = {
      name: name.trim(),
      updatedAt: now(),
    };
    if (nim) updateData.nim = nim.trim();
    if (email) updateData.email = email.trim();

    await db.users.update(session.userId, updateData);

    const updated = { ...currentUser, ...updateData };
    return Response.json({
      success: true,
      user: { id: updated.id, name: updated.name, nim: updated.nim, email: updated.email, role: updated.role },
    });
  } catch {
    return Response.json({ error: "Gagal memperbarui profil" }, { status: 500 });
  }
}
