import { getSession } from "@/lib/auth";
import { db } from "@/lib/db/firestore";
import type { User } from "@/lib/db/types";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.users.get(session.userId) as User | null;
  if (!user || user.isBlocked) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({
    user: { id: user.id, name: user.name, nim: user.nim, email: user.email, role: user.role },
  });
}
