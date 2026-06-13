import { db, now } from "@/lib/db/firestore";
import { getSessionFromRequest, requireDosen } from "@/lib/auth";
import type { Group, GroupMember } from "@/lib/db/types";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === "DOSEN") {
    const groups = await db.groups.list([
      { field: "createdById", op: "==", value: session.userId },
    ]) as Group[];

    // Count members for each group
    const groupsWithCount = await Promise.all(
      groups.map(async (g) => {
        const memberCount = await import("@/lib/db/firestore").then(({ countDocs, COL }) =>
          countDocs(COL.GROUP_MEMBERS, [{ field: "groupId", op: "==", value: g.id }])
        );
        return { ...g, _count: { members: memberCount } };
      })
    );

    return Response.json(groupsWithCount);
  }

  // MAHASISWA: return groups they belong to
  const memberships = await db.groupMembers.list([
    { field: "userId", op: "==", value: session.userId },
  ]) as GroupMember[];

  const groupPromises = memberships.map((m) => db.groups.get(m.groupId));
  const groupResults = await Promise.all(groupPromises);
  const groups = groupResults.filter(Boolean) as Group[];

  return Response.json(groups);
}

export async function POST(req: Request) {
  try {
    const session = await requireDosen(req);
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return Response.json({ error: "Nama kelas wajib diisi" }, { status: 400 });
    }

    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.groups.findByCode(code);
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    const timestamp = now();
    const group = await db.groups.create({
      name,
      description: description || null,
      code,
      createdById: session.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return Response.json(group, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal membuat kelas" }, { status: 500 });
  }
}
