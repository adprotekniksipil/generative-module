import { z } from "zod";

const rpsWeekSchema = z.object({
  weekNumber: z.number().int().min(1).max(16),
  topic: z.string().describe("Bahan kajian / materi pokok pertemuan ini"),
  finalAbility: z.string().describe("Kemampuan akhir yang direncanakan (sub-CPMK)"),
  method: z.string().describe("Metode pembelajaran, misal: Ceramah, Diskusi, Problem-Based Learning"),
  timeAllocation: z.number().int().default(150).describe("Alokasi waktu dalam menit"),
  learningExperience: z.string().describe("Pengalaman belajar mahasiswa selama pertemuan"),
  criteria: z.string().describe("Kriteria dan indikator penilaian"),
  weight: z.number().min(0).max(100).describe("Bobot penilaian dalam persen (%)"),
  isExam: z.boolean().default(false),
  examType: z.enum(["UTS", "UAS"]).optional(),
});

const assessmentSchemeSchema = z.object({
  component: z.string().describe("Komponen penilaian, misal: Tugas, UTS, UAS, Praktikum"),
  weight: z.number().min(0).max(100).describe("Bobot dalam persen (%)"),
  description: z.string().describe("Keterangan singkat komponen penilaian"),
});

export const rpsOutputSchema = z.object({
  title: z.string().describe("Judul RPS, misal: RPS Mekanika Tanah"),
  description: z.string().describe("Deskripsi singkat mata kuliah (2-4 kalimat)"),
  cpl: z.array(z.string()).min(2).max(6).describe("Capaian Pembelajaran Lulusan yang dibebankan ke mata kuliah ini"),
  cpmk: z.array(z.string()).min(3).max(8).describe("Capaian Pembelajaran Mata Kuliah yang terukur"),
  assessmentScheme: z.array(assessmentSchemeSchema).describe("Skema dan bobot penilaian (total harus 100%)"),
  references: z.array(z.string()).min(3).describe("Daftar pustaka utama"),
  weeks: z.array(rpsWeekSchema).describe("Rencana pembelajaran per pertemuan"),
});

export type RPSOutput = z.infer<typeof rpsOutputSchema>;
