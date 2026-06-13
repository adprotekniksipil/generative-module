import { getTopicLabel, getSubTopicLabel } from "@/lib/constants/topics";
import type { GenerateQuizInput } from "@/lib/types";

const DIFFICULTY_CONFIG = {
  beginner: "Tingkat dasar - fokus pada pemahaman konsep dan hafalan rumus dasar",
  intermediate: "Tingkat menengah - melibatkan analisis dan penerapan rumus",
  advanced: "Tingkat lanjut - analisis kritis, perhitungan kompleks, studi kasus",
};

const TYPE_INSTRUCTIONS = {
  multiple_choice: "Semua soal berupa pilihan ganda (4 opsi: A, B, C, D)",
  essay: "Semua soal berupa esai/uraian yang membutuhkan penjelasan dan/atau perhitungan",
  true_false: "Semua soal berupa pernyataan Benar/Salah",
  mixed: "Kombinasi pilihan ganda, esai, dan benar/salah",
};

export function buildQuizPrompt(input: GenerateQuizInput): string {
  const topicLabel = getTopicLabel(input.topic);
  const subTopicLabel = getSubTopicLabel(input.topic, input.subTopic);
  const difficulty = DIFFICULTY_CONFIG[input.difficulty];
  const typeInstruction = TYPE_INSTRUCTIONS[input.questionType];
  const lang = input.language === "id" ? "Bahasa Indonesia" : "English";

  return `Buatkan ${input.questionCount} soal ujian untuk mata kuliah **${topicLabel}** dengan topik **${subTopicLabel}**.

Bahasa: ${lang}
Tingkat kesulitan: ${difficulty}
Tipe soal: ${typeInstruction}

Untuk setiap soal, berikan dalam format JSON array dengan struktur berikut:

{
  "title": "Soal Ujian ${subTopicLabel}",
  "questions": [
    {
      "number": 1,
      "type": "multiple_choice" | "essay" | "true_false",
      "question": "Teks pertanyaan lengkap",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "B",
      "explanation": "Penjelasan detail mengapa jawaban tersebut benar, termasuk langkah perhitungan jika ada",
      "points": 10,
      "bloomLevel": "C1-Mengingat | C2-Memahami | C3-Menerapkan | C4-Menganalisis | C5-Mengevaluasi | C6-Mencipta"
    }
  ]
}

Pedoman:
- Untuk pilihan ganda: buat 4 opsi (A-D), pastikan pengecoh (distractor) masuk akal
- Untuk esai: correctAnswer berisi jawaban ideal lengkap, options tidak perlu diisi
- Untuk benar/salah: options berisi ["Benar", "Salah"], correctAnswer berisi "Benar" atau "Salah"
- Distribusikan level Bloom secara bervariasi
- Total poin harus 100
- Sertakan perhitungan numerik jika relevan dengan topik
- Pembahasan (explanation) harus detail dan edukatif
- PENTING untuk rumus dan persamaan: Gunakan format LaTeX dengan delimiter yang benar:
  - Inline math: $rumus$ (contoh: $\\sigma = \\frac{F}{A}$)
  - Display/block math: $$rumus$$ (contoh: $$M = \\frac{wL^2}{8}$$)
  - Gunakan LaTeX untuk SEMUA simbol matematika, rumus, satuan teknis, dan notasi ilmiah
  - Jangan gunakan Unicode superscript/subscript, gunakan LaTeX: $m^2$, $F_y$, $\\sqrt{x}$
  - Contoh satuan: $\\text{kN/m}^2$, $\\text{MPa}$, $\\text{m}^3/\\text{s}$

${input.customInstructions ? `\nInstruksi tambahan:\n${input.customInstructions}` : ""}

PENTING: Kembalikan HANYA JSON yang valid, tanpa teks tambahan di luar JSON.`;
}
