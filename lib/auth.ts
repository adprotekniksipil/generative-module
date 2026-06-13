import { adminAuth } from "@/lib/firebase/admin";
import { db } from "@/lib/db/firestore";
import type { User } from "@/lib/db/types";

export interface SessionPayload {
  userId: string;
  email: string;
  role: "DOSEN" | "MAHASISWA";
  name: string;
}

// Alias backward compat
export type JWTPayload = SessionPayload;

// Ambil session dari Authorization header (Bearer <idToken>)
// atau dari cookie __session
export async function getSession(req: Request): Promise<SessionPayload | null> {
  try {
    const token = extractToken(req);
    if (!token) return null;

    const decoded = await adminAuth.verifyIdToken(token);
    const user = await db.users.get(decoded.uid) as User | null;
    if (!user || user.isBlocked) return null;

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
  } catch {
    return null;
  }
}

function extractToken(req: Request): string | null {
  // Authorization: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  // Cookie: __session=<token>
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)__session=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

// Backward compat alias
export async function getSessionFromRequest(req?: Request): Promise<SessionPayload | null> {
  if (!req) return null;
  return getSession(req);
}

export async function requireAuth(req?: Request): Promise<SessionPayload> {
  const session = req ? await getSession(req) : null;
  if (!session) {
    throw Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export async function requireDosen(req?: Request): Promise<SessionPayload> {
  const session = await requireAuth(req);
  if (session.role !== "DOSEN") {
    throw Response.json(
      { error: "Forbidden: hanya dosen yang diizinkan" },
      { status: 403 }
    );
  }
  return session;
}
