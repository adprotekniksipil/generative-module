import { NextRequest, NextResponse } from "next/server";
import { db, now } from "@/lib/db/firestore";
import { requireDosen } from "@/lib/auth";
import type { GradeMatrix, GradeComponent, GradeStudent, Group, GroupMember, User } from "@/lib/db/types";

export async function GET(req: NextRequest) {
  try {
    const session = await requireDosen(req);
    const groupId = req.nextUrl.searchParams.get("groupId");

    const where: Parameters<typeof db.gradeMatrices.list>[0] = [
      { field: "createdById", op: "==", value: session.userId },
    ];
    if (groupId) where.push({ field: "groupId", op: "==", value: groupId });

    const matrices = await db.gradeMatrices.list(where) as GradeMatrix[];

    const result = await Promise.all(
      matrices.map(async (m) => {
        const [components, students, group] = await Promise.all([
          db.gradeComponents.list([{ field: "gradeMatrixId", op: "==", value: m.id }]) as Promise<GradeComponent[]>,
          db.gradeStudents.list([{ field: "gradeMatrixId", op: "==", value: m.id }]) as Promise<GradeStudent[]>,
          m.groupId ? db.groups.get(m.groupId) as Promise<Group | null> : Promise.resolve(null),
        ]);

        return {
          id: m.id,
          title: m.title,
          description: m.description,
          group: group ? { id: group.id, name: group.name, code: group.code } : null,
          componentCount: components.length,
          studentCount: students.length,
          totalPercentage: components.reduce((s, c) => s + c.percentage, 0),
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        };
      })
    );

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Gagal memuat matriks nilai" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireDosen(req);
    const { title, description, groupId } = await req.json();

    if (!title?.trim()) return NextResponse.json({ error: "Judul wajib diisi" }, { status: 400 });
    if (!groupId) return NextResponse.json({ error: "Kelas wajib dipilih" }, { status: 400 });

    const group = await db.groups.get(groupId) as Group | null;
    if (!group) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });

    const members = await db.groupMembers.list([
      { field: "groupId", op: "==", value: groupId },
    ]) as GroupMember[];

    const memberUsers = await Promise.all(
      members.map((m) => db.users.get(m.userId) as Promise<User | null>)
    );

    const timestamp = now();
    const matrix = await db.gradeMatrices.create({
      title: title.trim(),
      description: description?.trim() || null,
      createdById: session.userId,
      groupId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Create default components
    const defaultComponents = [
      { name: "UTS", percentage: 25, order: 0 },
      { name: "UAS", percentage: 25, order: 1 },
      { name: "Quiz", percentage: 20, order: 2 },
      { name: "Kehadiran", percentage: 15, order: 3 },
      { name: "Praktek", percentage: 15, order: 4 },
    ];
    await Promise.all(
      defaultComponents.map((c) =>
        db.gradeComponents.create({ gradeMatrixId: matrix.id, ...c })
      )
    );

    // Create students from group members
    await Promise.all(
      memberUsers.map((user, i) => {
        if (!user) return Promise.resolve();
        return db.gradeStudents.create({
          gradeMatrixId: matrix.id,
          name: user.name,
          nim: user.nim ?? null,
          order: i,
        });
      })
    );

    return NextResponse.json({ id: matrix.id }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Gagal membuat matriks nilai" }, { status: 500 });
  }
}
