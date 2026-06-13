import { jsPDF } from "jspdf";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType,
} from "docx";
import { requireDosen } from "@/lib/auth";
import { db } from "@/lib/db/firestore";
import type { QuizAttempt, Quiz, User, Group, GroupMember } from "@/lib/db/types";

type AttemptRow = {
  id: string; score: number; totalPoints: number; completedAt: string | null | undefined;
  quiz: { id: string; title: string; topic: string; subTopic: string; difficulty: string; totalPoints: number };
  user: { id: string; name: string; email: string; nim?: string | null };
};

type StudentStat = {
  userId: string; name: string; nim: string | null; email: string;
  attemptCount: number; avgScore: number; highestScore: number; passRate: number;
};

function calcPct(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 1000) / 10 : 0;
}

function toStudentStats(attempts: AttemptRow[]): StudentStat[] {
  const map = new Map<string, { user: AttemptRow["user"]; scores: number[] }>();
  for (const a of attempts) {
    if (!map.has(a.user.id)) map.set(a.user.id, { user: a.user, scores: [] });
    map.get(a.user.id)!.scores.push(calcPct(a.score, a.totalPoints));
  }
  return Array.from(map.values()).map(({ user, scores }) => ({
    userId: user.id, name: user.name, nim: user.nim ?? null, email: user.email,
    attemptCount: scores.length,
    avgScore: Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10,
    highestScore: Math.max(...scores),
    passRate: Math.round((scores.filter((s) => s >= 60).length / scores.length) * 1000) / 10,
  }));
}

function formatDateStr(d: string | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function drawPDFTable(doc: jsPDF, cols: { header: string; w: number }[], rows: string[][], startX: number, startY: number, pageH: number): void {
  const rowH = 8; const headerH = 9; const bottomMargin = 20; let y = startY;
  const colX = cols.reduce<number[]>((acc, _col, i) => { acc.push(i === 0 ? startX : acc[i - 1] + cols[i - 1].w); return acc; }, []);
  const drawHeader = () => {
    for (let ci = 0; ci < cols.length; ci++) {
      const col = cols[ci]; const cx = colX[ci];
      doc.setFillColor(37, 99, 235); doc.setDrawColor(30, 64, 175); doc.rect(cx, y, col.w, headerH, "FD");
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
      const maxChars = Math.max(Math.floor(col.w / 1.8), 3);
      const label = col.header.length > maxChars ? col.header.slice(0, maxChars - 1) + "…" : col.header;
      doc.text(label, cx + col.w / 2, y + 6, { align: "center" });
    }
    y += headerH;
  };
  drawHeader();
  for (let ri = 0; ri < rows.length; ri++) {
    if (y + rowH > pageH - bottomMargin) { doc.addPage(); y = 20; drawHeader(); }
    const row = rows[ri]; const isEven = ri % 2 === 0;
    for (let ci = 0; ci < cols.length; ci++) {
      const col = cols[ci]; const cx = colX[ci];
      if (isEven) doc.setFillColor(245, 247, 250); else doc.setFillColor(255, 255, 255);
      doc.setDrawColor(210, 215, 220); doc.rect(cx, y, col.w, rowH, "FD");
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(30, 30, 30);
      const maxChars = Math.max(Math.floor(col.w / 2.0), 4);
      const text = row[ci] ?? "";
      const display = text.length > maxChars ? text.slice(0, maxChars - 1) + "…" : text;
      doc.text(display, cx + col.w / 2, y + 5.5, { align: "center" });
    }
    y += rowH;
  }
}

function generatePDF(params: { scope: "all" | "group" | "student"; title: string; subtitle: string; attempts: AttemptRow[]; dateStr: string }): ArrayBuffer {
  const { scope, title, subtitle, attempts, dateStr } = params;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth(); const pageH = doc.internal.pageSize.getHeight();
  const ml = 15; let y = 18;
  doc.setFontSize(15); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
  doc.text(title, pageW / 2, y, { align: "center" }); y += 7;
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
  if (subtitle) { doc.text(subtitle, pageW / 2, y, { align: "center" }); y += 5; }
  doc.text(`Dicetak: ${dateStr}`, pageW / 2, y, { align: "center" }); doc.setTextColor(0); y += 10;
  if (scope === "student") {
    const cols = [{ header: "No", w: 9 }, { header: "Judul Kuis", w: 82 }, { header: "Topik", w: 52 }, { header: "Skor/Total", w: 28 }, { header: "Persen", w: 24 }, { header: "Status", w: 28 }, { header: "Tanggal", w: 32 }];
    const rows = [...attempts].sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")).map((a, i) => {
      const pct = calcPct(a.score, a.totalPoints);
      return [String(i + 1), a.quiz.title, a.quiz.subTopic, `${a.score}/${a.totalPoints}`, `${pct}%`, pct >= 60 ? "Lulus" : "Tidak Lulus", formatDateStr(a.completedAt)];
    });
    drawPDFTable(doc, cols, rows, ml, y, pageH);
  } else {
    const stats = toStudentStats(attempts).sort((a, b) => b.avgScore - a.avgScore);
    const cols = [{ header: "No", w: 9 }, { header: "Nama Mahasiswa", w: 60 }, { header: "NIM", w: 28 }, { header: "Email", w: 65 }, { header: "Percobaan", w: 24 }, { header: "Rata-rata", w: 26 }, { header: "Tertinggi", w: 26 }, { header: "% Lulus", w: 24 }];
    const rows = stats.map((s, i) => [String(i + 1), s.name, s.nim ?? "-", s.email, String(s.attemptCount), `${s.avgScore}%`, `${s.highestScore}%`, `${s.passRate}%`]);
    drawPDFTable(doc, cols, rows, ml, y, pageH);
  }
  return doc.output("arraybuffer");
}

function buildDocxTable(headers: string[], rows: string[][], widths: number[]): Table {
  const headerRow = new TableRow({ tableHeader: true, children: headers.map((h, i) => new TableCell({ width: { size: widths[i], type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 18 })] })], shading: { fill: "2563EB" } })) });
  const dataRows = rows.map((row) => new TableRow({ children: row.map((cell, ci) => new TableCell({ width: { size: widths[ci], type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: cell, size: 18 })] })] })) }));
  return new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } });
}

async function generateDOCX(params: { scope: "all" | "group" | "student"; title: string; subtitle: string; attempts: AttemptRow[]; dateStr: string }): Promise<Buffer> {
  const { scope, title, subtitle, attempts, dateStr } = params;
  const children: (Paragraph | Table)[] = [];
  children.push(new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
  if (subtitle) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: subtitle, size: 20, color: "475569" })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: `Dicetak: ${dateStr}`, size: 18, color: "94A3B8", italics: true })] }));
  if (scope === "student") {
    const headers = ["No", "Judul Kuis", "Topik", "Skor/Total", "Persen", "Status", "Tanggal"];
    const widths = [400, 2800, 1800, 1000, 900, 1000, 1200];
    const rows = [...attempts].sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")).map((a, i) => {
      const pct = calcPct(a.score, a.totalPoints);
      return [String(i + 1), a.quiz.title, a.quiz.subTopic, `${a.score}/${a.totalPoints}`, `${pct}%`, pct >= 60 ? "Lulus" : "Tidak Lulus", formatDateStr(a.completedAt)];
    });
    children.push(buildDocxTable(headers, rows, widths));
  } else {
    const stats = toStudentStats(attempts).sort((a, b) => b.avgScore - a.avgScore);
    const headers = ["No", "Nama Mahasiswa", "NIM", "Email", "Percobaan", "Rata-rata", "Tertinggi", "% Lulus"];
    const widths = [400, 2000, 900, 2000, 700, 700, 700, 700];
    const rows = stats.map((s, i) => [String(i + 1), s.name, s.nim ?? "-", s.email, String(s.attemptCount), `${s.avgScore}%`, `${s.highestScore}%`, `${s.passRate}%`]);
    children.push(buildDocxTable(headers, rows, widths));
  }
  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBuffer(doc);
}

export async function POST(req: Request) {
  try { await requireDosen(req); } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { format, scope, groupId, studentId }: { format: "pdf" | "docx"; scope: "all" | "group" | "student"; groupId?: string; studentId?: string } = body;

  let rawAttempts: QuizAttempt[];
  let title = "Laporan Nilai Mahasiswa";
  let subtitle = "";

  if (scope === "group" && groupId) {
    const group = await db.groups.get(groupId) as Group | null;
    if (!group) return Response.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    const members = await db.groupMembers.list([{ field: "groupId", op: "==", value: groupId }]) as GroupMember[];
    const attemptsPerUser = await Promise.all(members.map((m) => db.quizAttempts.list([{ field: "userId", op: "==", value: m.userId }]) as Promise<QuizAttempt[]>));
    rawAttempts = attemptsPerUser.flat();
    title = `Laporan Nilai - ${group.name}`;
    subtitle = `Kelas: ${group.name} (Kode: ${group.code})`;
  } else if (scope === "student" && studentId) {
    const user = await db.users.get(studentId) as User | null;
    if (!user) return Response.json({ error: "Mahasiswa tidak ditemukan" }, { status: 404 });
    rawAttempts = await db.quizAttempts.list([{ field: "userId", op: "==", value: studentId }]) as QuizAttempt[];
    title = `Laporan Nilai - ${user.name}`;
    subtitle = `${user.name}${user.nim ? ` (NIM: ${user.nim})` : ""}  •  ${user.email}`;
  } else {
    rawAttempts = await db.quizAttempts.list() as QuizAttempt[];
  }

  const quizIds = [...new Set(rawAttempts.map((a) => a.quizId))];
  const userIds = [...new Set(rawAttempts.map((a) => a.userId))];
  const [quizResults, userResults] = await Promise.all([
    Promise.all(quizIds.map((id) => db.quizzes.get(id) as Promise<Quiz | null>)),
    Promise.all(userIds.map((id) => db.users.get(id) as Promise<User | null>)),
  ]);
  const quizMap = new Map(quizIds.map((id, i) => [id, quizResults[i]]));
  const userMap = new Map(userIds.map((id, i) => [id, userResults[i]]));

  const attempts: AttemptRow[] = rawAttempts.map((a) => {
    const quiz = quizMap.get(a.quizId);
    const user = userMap.get(a.userId);
    if (!quiz || !user) return null;
    return {
      id: a.id, score: a.score, totalPoints: a.totalPoints, completedAt: a.completedAt,
      quiz: { id: quiz.id, title: quiz.title, topic: quiz.topic, subTopic: quiz.subTopic, difficulty: quiz.difficulty, totalPoints: quiz.totalPoints },
      user: { id: user.id, name: user.name, email: user.email, nim: user.nim },
    };
  }).filter(Boolean) as AttemptRow[];

  const dateStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const params = { scope, title, subtitle, attempts, dateStr };

  if (format === "pdf") {
    const buffer = generatePDF(params);
    const filename = `laporan-nilai-${scope === "group" ? "kelas" : scope === "student" ? "mahasiswa" : "semua"}.pdf`;
    return new Response(buffer, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"` } });
  } else {
    const buffer = await generateDOCX(params);
    const filename = `laporan-nilai-${scope === "group" ? "kelas" : scope === "student" ? "mahasiswa" : "semua"}.docx`;
    return new Response(buffer.buffer as ArrayBuffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename="${filename}"` } });
  }
}
