import { adminAuth } from "@/lib/firebase/admin";
import { db, now } from "@/lib/db/firestore";
import type { User } from "@/lib/db/types";

export async function POST(req: Request) {
  try {
    const { idToken, name, nim } = await req.json();

    if (!idToken || !name) {
      return Response.json({ error: "ID token dan nama wajib diisi" }, { status: 400 });
    }

    // Verifikasi token Firebase Auth yang sudah dibuat client
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Cek apakah profil sudah ada
    const existing = await db.users.get(decoded.uid);
    if (existing) {
      return Response.json({ error: "Akun sudah terdaftar" }, { status: 409 });
    }

    // Cek NIM duplikat
    if (nim) {
      const existingNim = await db.users.findByNim(nim);
      if (existingNim) {
        return Response.json({ error: "NIM sudah terdaftar" }, { status: 409 });
      }
    }

    const timestamp = now();
    const user = await db.users.create(
      {
        name,
        email: decoded.email ?? "",
        nim: nim || null,
        role: "MAHASISWA",
        isBlocked: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      decoded.uid  // Pakai Firebase Auth UID sebagai doc ID
    ) as User;

    return new Response(
      JSON.stringify({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `__session=${idToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`,
        },
      }
    );
  } catch {
    return Response.json({ error: "Gagal mendaftar" }, { status: 500 });
  }
}
