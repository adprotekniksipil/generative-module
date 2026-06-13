import { getTopicLabel, getSubTopicLabel } from "@/lib/constants/topics";
import type { GenerateMaterialInput } from "@/lib/types";

const DEPTH_CONFIG = {
  brief: { words: "1.000-2.000", examples: 1 },
  standard: { words: "3.000-5.000", examples: 2 },
  comprehensive: { words: "6.000-10.000", examples: 3 },
};

const DIFFICULTY_CONFIG = {
  beginner: "Tingkat dasar (semester 1-3). Jelaskan konsep dari awal, gunakan analogi sederhana, hindari derivasi matematika yang kompleks.",
  intermediate: "Tingkat menengah (semester 4-6). Asumsikan pemahaman dasar sudah ada, sertakan derivasi rumus, analisis lebih mendalam.",
  advanced: "Tingkat lanjut (semester 7-8 / pascasarjana). Pembahasan mendalam, studi kasus kompleks, analisis kritis, metode numerik.",
};

export function buildMaterialPrompt(input: GenerateMaterialInput): string {
  const topicLabel = getTopicLabel(input.topic);
  const subTopicLabel = getSubTopicLabel(input.topic, input.subTopic);
  const depth = DEPTH_CONFIG[input.depth];
  const difficulty = DIFFICULTY_CONFIG[input.difficulty];
  const lang = input.language === "id" ? "Bahasa Indonesia" : "English";

  return `Buatkan modul pembelajaran untuk mata kuliah **${topicLabel}** dengan topik **${subTopicLabel}**.

Bahasa: ${lang}
Tingkat kesulitan: ${difficulty}
Kedalaman: ${depth.words} kata, minimal ${depth.examples} contoh soal

Struktur modul yang harus diikuti:

# ${subTopicLabel}

## 1. Capaian Pembelajaran
- Tuliskan 3-5 capaian pembelajaran yang spesifik dan terukur

## 2. Pendahuluan
- Pengantar topik dan relevansinya dalam teknik sipil
- Hubungan dengan topik lain yang terkait

## 3. Materi Inti
- Penjelasan teori dan konsep utama
- Rumus-rumus penting dengan penjelasan setiap variabel
- Gunakan diagram Mermaid untuk visualisasi konsep (JANGAN tulis placeholder gambar/ilustrasi)
- Sub-bab sesuai kebutuhan topik

## 4. Contoh Soal dan Pembahasan
- Minimal ${depth.examples} contoh soal dengan penyelesaian langkah demi langkah
- Sertakan satuan dalam setiap perhitungan
- Tampilkan proses perhitungan yang detail

## 5. Rangkuman
- Poin-poin kunci dari materi

## 6. Latihan Mandiri
- 3-5 soal latihan (tanpa jawaban, untuk dikerjakan mahasiswa)

## 7. Daftar Pustaka
- Minimal 3 referensi (buku teks, standar SNI, atau referensi internasional)

${input.customInstructions ? `\nInstruksi tambahan dari dosen:\n${input.customInstructions}` : ""}

PENTING:
- Tulis dalam format Markdown yang bersih. Gunakan heading (#, ##, ###), bullet points.
- Untuk rumus dan persamaan, WAJIB gunakan format LaTeX:
  - Inline math: $rumus$ (contoh: $\\sigma = \\frac{F}{A}$, $E = \\frac{\\sigma}{\\varepsilon}$)
  - Display/block math untuk rumus utama: $$rumus$$ (contoh: $$M = \\frac{wL^2}{8}$$)
  - Gunakan LaTeX untuk SEMUA simbol matematika, rumus, satuan, dan notasi: $m^2$, $F_y$, $\\sqrt{x}$, $\\text{kN/m}^2$
  - JANGAN gunakan Unicode superscript/subscript (², ³, dll), selalu gunakan LaTeX`;
}
