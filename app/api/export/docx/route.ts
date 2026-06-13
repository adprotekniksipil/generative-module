import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { requireAuth } from "@/lib/auth";
import type { QuizQuestion } from "@/lib/types";

export async function POST(req: Request) {
  try { await requireAuth(req); } catch (e) { if (e instanceof Response) return e; }
  const body = await req.json();
  const { type, title, content, questions, showAnswers } = body;

  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  if (type === "material" && content) {
    const lines = (content as string).split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        children.push(new Paragraph({ text: "" }));
        continue;
      }
      if (trimmed.startsWith("### ")) {
        children.push(
          new Paragraph({
            text: trimmed.replace("### ", ""),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200 },
          })
        );
      } else if (trimmed.startsWith("## ")) {
        children.push(
          new Paragraph({
            text: trimmed.replace("## ", ""),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300 },
          })
        );
      } else if (trimmed.startsWith("# ")) {
        children.push(
          new Paragraph({
            text: trimmed.replace("# ", ""),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400 },
          })
        );
      } else if (trimmed.startsWith("- ")) {
        children.push(
          new Paragraph({
            text: trimmed.slice(2),
            bullet: { level: 0 },
          })
        );
      } else {
        // Handle bold text
        const parts = trimmed.split(/(\*\*.*?\*\*)/g);
        const runs = parts.map((part) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return new TextRun({
              text: part.slice(2, -2),
              bold: true,
            });
          }
          return new TextRun({ text: part });
        });
        children.push(new Paragraph({ children: runs }));
      }
    }
  }

  if (type === "quiz" && questions) {
    const quizQuestions = questions as QuizQuestion[];
    for (const q of quizQuestions) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${q.number}. ${q.question}`, bold: true }),
          ],
          spacing: { before: 300 },
        })
      );

      if (q.options) {
        for (const opt of q.options) {
          children.push(
            new Paragraph({ text: `    ${opt}`, spacing: { before: 50 } })
          );
        }
      }

      if (showAnswers) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Jawaban: ", bold: true }),
              new TextRun({ text: q.correctAnswer }),
            ],
            spacing: { before: 150 },
          })
        );
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Pembahasan: ", bold: true, italics: true }),
              new TextRun({ text: q.explanation, italics: true }),
            ],
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(doc);

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${title}.docx"`,
    },
  });
}
