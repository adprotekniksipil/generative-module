import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface ExportComponent { name: string; percentage: number }
export interface ExportStudent {
  name: string;
  nim: string | null;
  scores: (number | null)[];
}
export interface ExportGradeScale { letter: string; min: number }

export interface GradeMatrixExportData {
  title: string;
  groupName?: string;
  components: ExportComponent[];
  students: ExportStudent[];
  scale: ExportGradeScale[];
}

function weightedScore(scores: (number | null)[], components: ExportComponent[]): number {
  return components.reduce((sum, c, i) => sum + (scores[i] ?? 0) * (c.percentage / 100), 0);
}

function letterGrade(score: number, scale: ExportGradeScale[]): string {
  const sorted = [...scale].sort((a, b) => b.min - a.min);
  return sorted.find((s) => score >= s.min)?.letter ?? "E";
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

export function exportGradeMatrixPdf(data: GradeMatrixExportData) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("MATRIKS NILAI MAHASISWA", 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Mata Kuliah / Judul : ${data.title}`, 14, 26);
  if (data.groupName) doc.text(`Kelas               : ${data.groupName}`, 14, 32);
  doc.text(
    `Tanggal             : ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    14,
    data.groupName ? 38 : 32
  );

  const startY = data.groupName ? 44 : 38;

  // Build table
  const head: string[][] = [
    [
      "No",
      "Nama Mahasiswa",
      "NIM",
      ...data.components.map((c) => `${c.name}\n(${c.percentage}%)`),
      "Nilai\nAkhir",
      "Huruf",
    ],
  ];

  const body = data.students.map((s, i) => {
    const ws = Math.round(weightedScore(s.scores, data.components) * 10) / 10;
    const letter = s.scores.some((sc) => sc !== null) ? letterGrade(ws, data.scale) : "–";
    return [
      String(i + 1),
      s.name,
      s.nim ?? "–",
      ...data.components.map((_, ci) => (s.scores[ci] !== null ? String(s.scores[ci]) : "–")),
      s.scores.some((sc) => sc !== null) ? String(ws) : "–",
      letter,
    ];
  });

  // Average row
  const avgScores = data.components.map((_, ci) => {
    const vals = data.students.map((s) => s.scores[ci]).filter((v): v is number => v !== null);
    return vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  });
  const avgFinal = data.students
    .filter((s) => s.scores.some((sc) => sc !== null))
    .map((s) => weightedScore(s.scores, data.components));
  const avgFinalVal = avgFinal.length > 0
    ? Math.round((avgFinal.reduce((a, b) => a + b, 0) / avgFinal.length) * 10) / 10
    : null;

  body.push([
    "",
    "Rata-rata Kelas",
    "",
    ...avgScores.map((v) => (v !== null ? String(v) : "–")),
    avgFinalVal !== null ? String(avgFinalVal) : "–",
    avgFinalVal !== null ? letterGrade(avgFinalVal, data.scale) : "–",
  ]);

  autoTable(doc, {
    head,
    body,
    startY,
    styles: { fontSize: 8, cellPadding: 2, halign: "center" },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { halign: "left", cellWidth: 45 },
      2: { cellWidth: 22 },
    },
    headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: "bold", halign: "center" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didParseCell: (hookData) => {
      // Highlight last row (average)
      if (hookData.row.index === body.length - 1) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = [219, 234, 254];
      }
      // Color letter grade column
      const lastColIdx = data.components.length + 3;
      if (hookData.section === "body" && hookData.column.index === lastColIdx) {
        const letter = String(hookData.cell.raw);
        const colorMap: Record<string, [number, number, number]> = {
          A: [209, 250, 229], AB: [167, 243, 208], B: [219, 234, 254],
          BC: [186, 230, 253], C: [254, 243, 199], D: [254, 215, 170], E: [254, 202, 202],
        };
        if (colorMap[letter]) hookData.cell.styles.fillColor = colorMap[letter];
      }
    },
  });

  // Grade scale footer
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("Skala Nilai:", 14, finalY);
  doc.setFont("helvetica", "normal");
  const sorted = [...data.scale].sort((a, b) => b.min - a.min);
  const scaleText = sorted.map((s, i) => {
    const max = i === 0 ? 100 : sorted[i - 1].min - 1;
    return `${s.letter} = ${s.min}–${max}`;
  }).join("   |   ");
  doc.text(scaleText, 14, finalY + 5);

  const safeName = data.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
  doc.save(`matriks-nilai-${safeName}.pdf`);
}

// ─── Excel ───────────────────────────────────────────────────────────────────

export function exportGradeMatrixXlsx(data: GradeMatrixExportData) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Nilai ───────────────────────────────────────────────────────
  const rows: (string | number | null)[][] = [];

  // Title rows
  rows.push([`Matriks Nilai: ${data.title}`]);
  if (data.groupName) rows.push([`Kelas: ${data.groupName}`]);
  rows.push([
    `Tanggal: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
  ]);
  rows.push([]); // spacer

  // Header row
  rows.push([
    "No", "Nama Mahasiswa", "NIM",
    ...data.components.map((c) => `${c.name} (${c.percentage}%)`),
    "Nilai Akhir", "Huruf",
  ]);

  // Data rows
  data.students.forEach((s, i) => {
    const ws = Math.round(weightedScore(s.scores, data.components) * 10) / 10;
    const hasScore = s.scores.some((sc) => sc !== null);
    rows.push([
      i + 1,
      s.name,
      s.nim ?? "",
      ...data.components.map((_, ci) => s.scores[ci] ?? ""),
      hasScore ? ws : "",
      hasScore ? letterGrade(ws, data.scale) : "",
    ]);
  });

  // Average row
  rows.push([]); // spacer
  const avgRow: (string | number)[] = ["", "Rata-rata Kelas", ""];
  data.components.forEach((_, ci) => {
    const vals = data.students.map((s) => s.scores[ci]).filter((v): v is number => v !== null);
    avgRow.push(vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : "");
  });
  const avgFinals = data.students
    .filter((s) => s.scores.some((sc) => sc !== null))
    .map((s) => weightedScore(s.scores, data.components));
  const avgFinalVal = avgFinals.length > 0
    ? Math.round((avgFinals.reduce((a, b) => a + b, 0) / avgFinals.length) * 10) / 10
    : "";
  avgRow.push(avgFinalVal);
  avgRow.push(typeof avgFinalVal === "number" ? letterGrade(avgFinalVal, data.scale) : "");
  rows.push(avgRow);

  const ws1 = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws1["!cols"] = [
    { wch: 5 }, { wch: 28 }, { wch: 14 },
    ...data.components.map(() => ({ wch: 14 })),
    { wch: 12 }, { wch: 8 },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, "Nilai");

  // ── Sheet 2: Skala Nilai ─────────────────────────────────────────────────
  const sorted = [...data.scale].sort((a, b) => b.min - a.min);
  const scaleRows: (string | number)[][] = [
    ["Huruf", "Nilai Minimum", "Nilai Maksimum"],
    ...sorted.map((s, i) => [s.letter, s.min, i === 0 ? 100 : sorted[i - 1].min - 1]),
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(scaleRows);
  ws2["!cols"] = [{ wch: 10 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Skala Nilai");

  const safeName = data.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
  XLSX.writeFile(wb, `matriks-nilai-${safeName}.xlsx`);
}
