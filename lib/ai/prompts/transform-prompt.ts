import type { GenerateMaterialInput } from "@/lib/types";

const DEPTH_CONFIG = {
  brief: { words: "1.000-2.000", examples: 1 },
  standard: { words: "3.000-5.000", examples: 2 },
  comprehensive: { words: "6.000-10.000", examples: 3 },
};

const DIFFICULTY_CONFIG = {
  beginner: "Tingkat dasar (semester 1-3). Sederhanakan konsep, gunakan analogi, hindari derivasi kompleks.",
  intermediate: "Tingkat menengah (semester 4-6). Sertakan derivasi rumus, analisis lebih mendalam.",
  advanced: "Tingkat lanjut (semester 7-8 / pascasarjana). Pembahasan mendalam, studi kasus kompleks.",
};

export function buildTransformPrompt(input: GenerateMaterialInput): string {
  const depth = DEPTH_CONFIG[input.depth];
  const difficulty = DIFFICULTY_CONFIG[input.difficulty];
  const lang = input.language === "id" ? "Bahasa Indonesia" : "English";

  return `Berdasarkan materi mentah berikut, buatlah modul pembelajaran yang terstruktur dan lengkap.

Bahasa output: ${lang}
Tingkat kesulitan: ${difficulty}
Kedalaman: ${depth.words} kata, minimal ${depth.examples} contoh soal

--- MATERI MENTAH ---
${input.sourceContent}
--- AKHIR MATERI MENTAH ---

${input.sourceUrl ? `Sumber: ${input.sourceUrl}` : ""}

Instruksi:
1. Analisis konten materi mentah di atas
2. Identifikasi topik utama dan sub-topik
3. Susun ulang menjadi modul pembelajaran dengan struktur berikut:

# [Judul Modul - tentukan berdasarkan konten]

## 1. Capaian Pembelajaran
- 3-5 capaian pembelajaran spesifik dan terukur

## 2. Pendahuluan
- Pengantar topik dan relevansinya

## 3. Materi Inti
- Susun ulang konten mentah menjadi penjelasan yang terstruktur
- Tambahkan teori/konsep yang belum ada tapi relevan
- Sertakan rumus-rumus penting dengan penjelasan variabel
- Tambahkan referensi ke standar (SNI, ACI, dll) jika relevan

## 4. Contoh Soal dan Pembahasan
- Buat ${depth.examples} contoh soal berdasarkan materi
- Sertakan penyelesaian langkah demi langkah

## 5. Rangkuman
- Poin-poin kunci

## 6. Latihan Mandiri
- 3-5 soal latihan

## 7. Daftar Pustaka
- Sertakan sumber asli dan referensi tambahan

${input.customInstructions ? `\nInstruksi tambahan dari dosen:\n${input.customInstructions}` : ""}

PENTING:
- Perkaya materi mentah, jangan hanya copy-paste
- Tambahkan konteks, penjelasan, dan contoh yang belum ada
- Tulis dalam format Markdown yang bersih`;
}
