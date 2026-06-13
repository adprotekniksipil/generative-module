import { NextRequest, NextResponse } from "next/server";
import { db, now } from "@/lib/db/firestore";
import { requireDosen } from "@/lib/auth";
import type { GradeMatrix, GradeComponent, GradeStudent, GradeScore, Group } from "@/lib/db/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await requireDosen(req);
    const { id } = await params;

    const matrix = await db.gradeMatrices.get(id) as GradeMatrix | null;
    if (!matrix || matrix.createdById !== session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [components, students, group] = await Promise.all([
      db.gradeComponents.list([{ field: "gradeMatrixId", op: "==", value: id }]) as Promise<GradeComponent[]>,
      db.gradeStudents.list([{ field: "gradeMatrixId", op: "==", value: id }]) as Promise<GradeStudent[]>,
      matrix.groupId ? db.groups.get(matrix.groupId) as Promise<Group | null> : Promise.resolve(null),
    ]);

    // Fetch all scores for this matrix's students in one go
    const studentIds = students.map((s) => s.id);
    const allScores = studentIds.length > 0
      ? (await Promise.all(
          studentIds.map((sid) =>
            db.gradeScores.list([{ field: "studentId", op: "==", value: sid }]) as Promise<GradeScore[]>
          )
        )).flat()
      : [] as GradeScore[];

    return NextResponse.json({
      id: matrix.id,
      title: matrix.title,
      description: matrix.description,
      group: group ? { id: group.id, name: group.name, code: group.code } : null,
      components: components.map((c) => ({
        id: c.id,
        name: c.name,
        percentage: c.percentage,
        order: c.order,
      })),
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        nim: s.nim,
        order: s.order,
        scores: components.map((c) => {
          const found = allScores.find((sc) => sc.componentId === c.id && sc.studentId === s.id);
          return found?.score ?? null;
        }),
      })),
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Gagal memuat matriks nilai" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await requireDosen(req);
    const { id } = await params;

    const matrix = await db.gradeMatrices.get(id) as GradeMatrix | null;
    if (!matrix || matrix.createdById !== session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body: {
      title: string;
      description?: string;
      components: { name: string; percentage: number; order: number }[];
      students: { name: string; nim?: string; order: number; scores: (number | null)[] }[];
    } = await req.json();

    await db.gradeMatrices.update(id, {
      title: body.title.trim(),
      description: body.description?.trim() || null,
      updatedAt: now(),
    });

    // Recreate components
    await db.gradeComponents.deleteByMatrix(id);
    const newComponents = await Promise.all(
      body.components.map((c) =>
        db.gradeComponents.create({
          gradeMatrixId: id,
          name: c.name,
          percentage: c.percentage,
          order: c.order,
        }) as Promise<GradeComponent>
      )
    );

    // Recreate students + scores
    await db.gradeStudents.deleteByMatrix(id);
    for (const s of body.students) {
      const student = await db.gradeStudents.create({
        gradeMatrixId: id,
        name: s.name,
        nim: s.nim || null,
        order: s.order,
      }) as GradeStudent;

      for (let i = 0; i < newComponents.length; i++) {
        const score = s.scores[i];
        if (score !== null && score !== undefined) {
          await db.gradeScores.create({
            componentId: newComponents[i].id,
            studentId: student.id,
            score,
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Gagal menyimpan matriks nilai" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await requireDosen(req);
    const { id } = await params;

    const matrix = await db.gradeMatrices.get(id) as GradeMatrix | null;
    if (!matrix || matrix.createdById !== session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete components, students, and their scores
    const components = await db.gradeComponents.list([
      { field: "gradeMatrixId", op: "==", value: id },
    ]) as GradeComponent[];
    await Promise.all(components.map((c) => db.gradeScores.deleteByComponent(c.id)));

    await Promise.all([
      db.gradeComponents.deleteByMatrix(id),
      db.gradeStudents.deleteByMatrix(id),
    ]);
    await db.gradeMatrices.delete(id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Gagal menghapus matriks nilai" }, { status: 500 });
  }
}
