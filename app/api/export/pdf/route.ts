import { jsPDF } from "jspdf";
import { requireAuth } from "@/lib/auth";
import type { QuizQuestion } from "@/lib/types";

export async function POST(req: Request) {
  try { await requireAuth(req); } catch (e) { if (e instanceof Response) return e; }
  const body = await req.json();
  const { type, title, content, questions, showAnswers } = body;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const addText = (
    text: string,
    fontSize: number,
    isBold = false,
    indent = 0
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, maxWidth - indent);
    for (const line of lines) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin + indent, y);
      y += fontSize * 0.5;
    }
    y += 3;
  };

  // Title
  addText(title, 16, true);
  y += 5;

  if (type === "material" && content) {
    // Simple markdown to PDF conversion
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        y += 3;
        continue;
      }
      if (trimmed.startsWith("### ")) {
        y += 3;
        addText(trimmed.replace("### ", ""), 11, true);
      } else if (trimmed.startsWith("## ")) {
        y += 5;
        addText(trimmed.replace("## ", ""), 13, true);
      } else if (trimmed.startsWith("# ")) {
        // Skip title (already added)
      } else if (trimmed.startsWith("- ")) {
        addText(`\u2022 ${trimmed.slice(2)}`, 10, false, 5);
      } else {
        addText(trimmed.replace(/\*\*/g, "").replace(/\*/g, ""), 10);
      }
    }
  }

  if (type === "quiz" && questions) {
    const quizQuestions = questions as QuizQuestion[];
    for (const q of quizQuestions) {
      addText(`${q.number}. ${q.question}`, 10, true);

      if (q.options && q.options.length > 0) {
        for (const opt of q.options) {
          addText(opt, 10, false, 8);
        }
      }

      if (showAnswers) {
        y += 2;
        addText(`Jawaban: ${q.correctAnswer}`, 9, true, 5);
        addText(`Pembahasan: ${q.explanation}`, 9, false, 5);
      }

      y += 5;
    }
  }

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${title}.pdf"`,
    },
  });
}
