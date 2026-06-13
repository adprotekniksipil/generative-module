import { db, now, countDocs, getDocs, COL } from "@/lib/db/firestore";
import { requireDosen } from "@/lib/auth";
import { NextRequest } from "next/server";
import type { Group, GroupMember, User } from "@/lib/db/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDosen(req);
    const { id } = await params;

    const group = await db.groups.get(id) as Group | null;
    if (!group || group.createdById !== session.userId) {
      return Response.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }

    const members = await db.groupMembers.list([
      { field: "groupId", op: "==", value: id },
    ]) as GroupMember[];

    const userResults = await Promise.all(members.map((m) => db.users.get(m.userId)));

    const membersWithUser = members.map((m, i) => {
      const user = userResults[i] as User | null;
      return {
        ...m,
        user: user
          ? { id: user.id, name: user.name, email: user.email, role: user.role }
          : null,
      };
    });

    const [materialCount, quizCount] = await Promise.all([
      countDocs(COL.MATERIALS, [{ field: "groupIds", op: "array-contains", value: id }]),
      countDocs(COL.QUIZZES, [{ field: "groupIds", op: "array-contains", value: id }]),
    ]);

    return Response.json({
      ...group,
      members: membersWithUser,
      _count: { members: members.length, materials: materialCount, quizzes: quizCount },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal memuat kelas" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDosen(req);
    const { id } = await params;
    const body = await req.json();

    const group = await db.groups.get(id) as Group | null;
    if (!group || group.createdById !== session.userId) {
      return Response.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }

    const updateData = {
      name: body.name ?? group.name,
      description: body.description !== undefined ? body.description : group.description,
      updatedAt: now(),
    };
    await db.groups.update(id, updateData);

    return Response.json({ ...group, ...updateData });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal mengupdate kelas" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDosen(req);
    const { id } = await params;

    const group = await db.groups.get(id) as Group | null;
    if (!group || group.createdById !== session.userId) {
      return Response.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }

    // Delete all members first
    const members = await getDocs<GroupMember>(COL.GROUP_MEMBERS, [
      { field: "groupId", op: "==", value: id },
    ]);
    await Promise.all(members.map((m) => db.groupMembers.delete(m.id)));

    await db.groups.delete(id);
    return Response.json({ success: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal menghapus kelas" }, { status: 500 });
  }
}
