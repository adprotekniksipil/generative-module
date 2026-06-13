import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/firestore";
import { requireAuth } from "@/lib/auth";
import type { GradeStudent, GradeScore, GradeComponent, GradeMatrix, Group, User } from "@/lib/db/types";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    const user = await db.users.get(session.userId) as User | null;
    if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

    // Match GradeStudent by NIM first, fallback to name
    const where = user.nim
      ? [{ field: "nim" as const, op: "==" as const, value: user.nim }]
      : [{ field: "name" as const, op: "==" as const, value: user.name }];

    const gradeStudents = await db.gradeStudents.list(where) as GradeStudent[];

    const results = await Promise.all(
      gradeStudents.map(async (gs) => {
        const [scores, matrix] = await Promise.all([
          db.gradeScores.list([{ field: "studentId", op: "==", value: gs.id }]) as Promise<GradeScore[]>,
          db.gradeMatrices.get(gs.gradeMatrixId) as Promise<GradeMatrix | null>,
        ]);

        if (!matrix) return null;

        const [components, group, creator] = await Promise.all([
          db.gradeComponents.list([{ field: "gradeMatrixId", op: "==", value: matrix.id }]) as Promise<GradeComponent[]>,
          matrix.groupId ? db.groups.get(matrix.groupId) as Promise<Group | null> : Promise.resolve(null),
          matrix.createdById ? db.users.get(matrix.createdById) as Promise<User | null> : Promise.resolve(null),
        ]);

        const componentDetails = components.map((c) => {
          const scoreRecord = scores.find((s) => s.componentId === c.id);
          const score = scoreRecord?.score ?? null;
          return {
            id: c.id,
            name: c.name,
            percentage: c.percentage,
            score,
            weighted: score !== null ? (score * c.percentage) / 100 : null,
          };
        });

        const filledComponents = componentDetails.filter((c) => c.score !== null);
        const finalGrade =
          filledComponents.length > 0
            ? filledComponents.reduce((s, c) => s + c.weighted!, 0)
            : null;

        return {
          matrixId: matrix.id,
          matrixTitle: matrix.title,
          description: matrix.description,
          group: group ? { id: group.id, name: group.name, code: group.code } : null,
          dosenName: creator?.name ?? null,
          studentName: gs.name,
          studentNim: gs.nim,
          components: componentDetails,
          totalPercentage: componentDetails.reduce((s, c) => s + c.percentage, 0),
          finalGrade: finalGrade !== null ? Math.round(finalGrade * 10) / 10 : null,
          updatedAt: matrix.updatedAt,
        };
      })
    );

    return NextResponse.json(results.filter(Boolean));
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Gagal memuat nilai" }, { status: 500 });
  }
}
