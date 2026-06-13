import { getTopicLabel, getSubTopicLabel } from "@/lib/constants/topics";
import type { GenerateRPSInput } from "@/lib/types";

export function buildRPSPrompt(input: GenerateRPSInput): string {
  const topicLabel = getTopicLabel(input.topic);
  const subTopicLabel = getSubTopicLabel(input.topic, input.subTopic);
  const lang = input.language === "id" ? "Bahasa Indonesia" : "English";
  const weekLabel = input.weekCount === 14 ? "14 pertemuan (+ 1 UTS + 1 UAS = 16 minggu)" : "16 pertemuan (termasuk UTS minggu 8 dan UAS minggu 16)";

  return `Buatkan RPS (Rencana Pembelajaran Semester) yang lengkap dan sesuai standar Dikti (Permendikbud No. 3 Tahun 2020) untuk mata kuliah berikut:

**Informasi Mata Kuliah:**
- Nama: ${input.courseName}
- Kode: ${input.courseCode || "—"}
- Program Studi: ${input.program}
- SKS: ${input.credits}
- Semester: ${input.semester} (${input.semesterType} ${input.academicYear})
- Prasyarat: ${input.prerequisite || "Tidak ada"}
- Bidang: ${topicLabel}
- Topik Utama: ${subTopicLabel}
- Bahasa: ${lang}
- Jumlah Pertemuan: ${weekLabel}

**Yang harus di-generate:**

1. **Deskripsi Mata Kuliah**: 2-4 kalimat menjelaskan cakupan, relevansi, dan pendekatan pembelajaran.

2. **CPL (Capaian Pembelajaran Lulusan)**: 3-5 CPL yang dibebankan ke mata kuliah ini, menggunakan rumusan KKNI/OBE (Sikap, Pengetahuan, Keterampilan Umum, Keterampilan Khusus).

3. **CPMK (Capaian Pembelajaran Mata Kuliah)**: 4-7 CPMK yang spesifik, terukur, dan selaras dengan CPL. Gunakan kata kerja operasional Bloom (menjelaskan, menghitung, menganalisis, merancang, dsb).

4. **Skema Penilaian**: Komponen penilaian dengan bobot total 100%. Contoh: Tugas (20%), Kuis (10%), UTS (30%), UAS (40%).

5. **Rencana Per Pertemuan (${input.weekCount} pertemuan aktif)**:
   - Pertemuan 1–${Math.floor(input.weekCount / 2) - 1}: Materi sebelum UTS
   - Pertemuan ${Math.floor(input.weekCount / 2)}: UTS (isExam: true, examType: "UTS", weight: sesuai skema)
   - Pertemuan ${Math.floor(input.weekCount / 2) + 1}–${input.weekCount - 1}: Materi setelah UTS
   - Pertemuan ${input.weekCount}: UAS (isExam: true, examType: "UAS", weight: sesuai skema)

   Untuk setiap pertemuan non-ujian:
   - Kemampuan akhir yang direncanakan (sub-CPMK spesifik)
   - Bahan kajian/materi (judul topik yang jelas)
   - Metode: pilih yang sesuai (Ceramah + Tanya Jawab, Diskusi Kelompok, Problem-Based Learning, Project-Based Learning, Studi Kasus, dll)
   - Alokasi waktu: ${input.credits <= 2 ? "100" : "150"} menit per pertemuan
   - Pengalaman belajar mahasiswa (aktivitas konkret)
   - Kriteria dan indikator penilaian
   - Bobot: untuk pertemuan aktif distribusikan sesuai relevansi (total pertemuan aktif + UTS + UAS = 100%)

6. **Daftar Pustaka**: Minimal 4 referensi relevan (buku teks, standar SNI, ACI, Eurocode, dll).

${input.customInstructions ? `\n**Instruksi tambahan dari dosen:**\n${input.customInstructions}` : ""}

**Pedoman khusus teknik sipil:**
- Sesuaikan kedalaman materi dengan semester ${input.semester} (${input.semester <= 2 ? "dasar" : input.semester <= 4 ? "menengah" : "lanjut"})
- Sertakan topik perhitungan dan analisis kuantitatif yang sesuai bidang
- Integrasikan standar SNI dan referensi internasional yang relevan
- Pastikan CPMK mencakup kemampuan analitis dan aplikatif
- Rancang urutan pertemuan yang progresif (dari konsep dasar ke aplikasi)`;
}
