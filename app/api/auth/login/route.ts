// Firebase Auth login dilakukan di client-side menggunakan Firebase SDK
// Route ini hanya memvalidasi token yang sudah dibuat client dan mengembalikan profil user

import { adminAuth } from "@/lib/firebase/admin";
import { db } from "@/lib/db/firestore";
import type { User } from "@/lib/db/types";

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return Response.json({ error: "ID token wajib diisi" }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const profile = await db.users.get(decoded.uid) as User | null;

    if (!profile) {
      return Response.json({ error: "Profil pengguna tidak ditemukan" }, { status: 404 });
    }

    if (profile.isBlocked) {
      return Response.json({ error: "Akun Anda diblokir. Hubungi dosen/admin." }, { status: 403 });
    }

    return new Response(
      JSON.stringify({
        user: {
          id: profile.id,
          name: profile.name,
          nim: profile.nim,
          email: profile.email,
          role: profile.role,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `__session=${idToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`,
        },
      }
    );
  } catch {
    return Response.json({ error: "Gagal login" }, { status: 500 });
  }
}
