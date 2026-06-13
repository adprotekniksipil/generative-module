import { db, countDocs, COL } from "@/lib/db/firestore";
import { requireDosen } from "@/lib/auth";
import { NextRequest } from "next/server";
import type { User } from "@/lib/db/types";

export async function GET(req: NextRequest) {
  try {
    await requireDosen(req);

    const role = req.nextUrl.searchParams.get("role");

    const where = role
      ? [{ field: "role" as const, op: "==" as const, value: role }]
      : undefined;

    const users = await db.users.list(where) as User[];

    const usersWithCount = await Promise.all(
      users.map(async (u) => {
        const membershipCount = await countDocs(COL.GROUP_MEMBERS, [
          { field: "userId", op: "==", value: u.id },
        ]);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          nim: u.nim,
          role: u.role,
          isBlocked: u.isBlocked,
          createdAt: u.createdAt,
          _count: { memberships: membershipCount },
        };
      })
    );

    return Response.json(usersWithCount);
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal memuat pengguna" }, { status: 500 });
  }
}
