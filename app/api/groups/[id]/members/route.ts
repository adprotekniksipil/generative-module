import { db, now } from "@/lib/db/firestore";
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
          ? { id: user.id, name: user.name, email: user.email, role: user.role, isBlocked: user.isBlocked }
          : null,
      };
    });

    return Response.json(membersWithUser);
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal memuat anggota" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDosen(req);
    const { id } = await params;
    const body = await req.json();
    const { userIds } = body as { userIds: string[] };

    if (!userIds || userIds.length === 0) {
      return Response.json({ error: "Pilih minimal satu mahasiswa" }, { status: 400 });
    }

    const group = await db.groups.get(id) as Group | null;
    if (!group || group.createdById !== session.userId) {
      return Response.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }

    // Filter out already existing members
    const existing = await db.groupMembers.list([
      { field: "groupId", op: "==", value: id },
    ]) as GroupMember[];
    const existingIds = new Set(existing.map((e) => e.userId));
    const newUserIds = userIds.filter((uid) => !existingIds.has(uid));

    if (newUserIds.length === 0) {
      return Response.json({ error: "Semua mahasiswa sudah terdaftar di kelas ini" }, { status: 409 });
    }

    const joinedAt = now();
    await Promise.all(
      newUserIds.map((userId) =>
        db.groupMembers.create({ userId, groupId: id, joinedAt })
      )
    );

    return Response.json({ success: true, added: newUserIds.length });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal menambah anggota" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDosen(req);
    const { id } = await params;
    const body = await req.json();
    const { userId } = body;

    const group = await db.groups.get(id) as Group | null;
    if (!group || group.createdById !== session.userId) {
      return Response.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }

    await db.groupMembers.deleteWhere(userId, id);

    return Response.json({ success: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Gagal menghapus anggota" }, { status: 500 });
  }
}
