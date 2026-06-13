export interface SubTopic {
  id: string;
  label: string;
}

export interface Topic {
  id: string;
  label: string;
  subtopics: SubTopic[];
}

// DB shape from API
export interface DBSubTopic {
  id: string;
  slug: string;
  label: string;
  topicId: string;
  sortOrder: number;
}

export interface DBTopic {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
  subtopics: DBSubTopic[];
}

// Hardcoded fallback (used when DB is unavailable, e.g. AI prompts at build time)
export const TOPICS_FALLBACK: Topic[] = [
  {
    id: "structural",
    label: "Teknik Struktur",
    subtopics: [
      { id: "mekanika_struktur", label: "Mekanika Struktur" },
      { id: "beton_bertulang", label: "Beton Bertulang" },
      { id: "struktur_baja", label: "Struktur Baja" },
      { id: "struktur_kayu", label: "Struktur Kayu" },
      { id: "dinamika_struktur", label: "Dinamika Struktur" },
      { id: "teknik_gempa", label: "Teknik Gempa" },
      { id: "struktur_prategang", label: "Struktur Prategang" },
      { id: "analisis_elemen_hingga", label: "Analisis Elemen Hingga" },
    ],
  },
  {
    id: "geotechnical",
    label: "Geoteknik",
    subtopics: [
      { id: "mekanika_tanah", label: "Mekanika Tanah" },
      { id: "teknik_fondasi", label: "Teknik Fondasi" },
      { id: "dinding_penahan", label: "Dinding Penahan" },
      { id: "stabilitas_lereng", label: "Stabilitas Lereng" },
      { id: "perbaikan_tanah", label: "Perbaikan Tanah" },
      { id: "geoteknik_gempa", label: "Geoteknik Gempa" },
    ],
  },
  {
    id: "hydrology",
    label: "Teknik Sumber Daya Air",
    subtopics: [
      { id: "hidrologi", label: "Hidrologi" },
      { id: "hidrolika", label: "Hidrolika" },
      { id: "irigasi_drainase", label: "Irigasi dan Drainase" },
      { id: "bangunan_air", label: "Bangunan Air" },
      { id: "pengelolaan_sda", label: "Pengelolaan Sumber Daya Air" },
      { id: "pantai_pelabuhan", label: "Pantai dan Pelabuhan" },
    ],
  },
  {
    id: "transportation",
    label: "Teknik Transportasi",
    subtopics: [
      { id: "rekayasa_lalu_lintas", label: "Rekayasa Lalu Lintas" },
      { id: "perencanaan_transportasi", label: "Perencanaan Transportasi" },
      { id: "geometrik_jalan", label: "Geometrik Jalan" },
      { id: "perkerasan_jalan", label: "Perkerasan Jalan" },
      { id: "teknik_jalan_rel", label: "Teknik Jalan Rel" },
      { id: "transportasi_udara", label: "Transportasi Udara" },
    ],
  },
  {
    id: "construction",
    label: "Manajemen Konstruksi",
    subtopics: [
      { id: "manajemen_proyek", label: "Manajemen Proyek" },
      { id: "estimasi_biaya", label: "Estimasi Biaya (RAB)" },
      { id: "penjadwalan_proyek", label: "Penjadwalan Proyek" },
      { id: "k3_konstruksi", label: "K3 Konstruksi" },
      { id: "kontrak_hukum", label: "Kontrak dan Hukum Konstruksi" },
      { id: "pengendalian_mutu", label: "Pengendalian Mutu" },
    ],
  },
  {
    id: "environmental",
    label: "Teknik Lingkungan",
    subtopics: [
      { id: "air_bersih", label: "Penyediaan Air Bersih" },
      { id: "air_limbah", label: "Pengolahan Air Limbah" },
      { id: "pengelolaan_sampah", label: "Pengelolaan Sampah" },
      { id: "amdal", label: "AMDAL" },
      { id: "pencemaran_lingkungan", label: "Pencemaran Lingkungan" },
    ],
  },
  {
    id: "surveying",
    label: "Teknik Geodesi & Survei",
    subtopics: [
      { id: "ilmu_ukur_tanah", label: "Ilmu Ukur Tanah" },
      { id: "fotogrametri", label: "Fotogrametri" },
      { id: "sig", label: "Sistem Informasi Geografis (SIG)" },
      { id: "pemetaan_digital", label: "Pemetaan Digital" },
    ],
  },
];

// Legacy alias
export const TOPICS = TOPICS_FALLBACK;

export const DIFFICULTY_LEVELS = [
  { id: "beginner", label: "Dasar" },
  { id: "intermediate", label: "Menengah" },
  { id: "advanced", label: "Lanjut" },
] as const;

export const DEPTH_LEVELS = [
  { id: "brief", label: "Ringkas", description: "1.000-2.000 kata" },
  { id: "standard", label: "Standar", description: "3.000-5.000 kata" },
  { id: "comprehensive", label: "Komprehensif", description: "6.000-10.000 kata" },
] as const;

export const LANGUAGES = [
  { id: "id", label: "Bahasa Indonesia" },
  { id: "en", label: "English" },
] as const;

export const QUESTION_TYPES = [
  { id: "multiple_choice", label: "Pilihan Ganda" },
  { id: "essay", label: "Esai" },
  { id: "true_false", label: "Benar/Salah" },
  { id: "mixed", label: "Campuran" },
] as const;

// Lookup functions — work with both slug-based (DB) and legacy id-based topics
export function getTopicLabel(topicSlug: string): string {
  return TOPICS_FALLBACK.find((t) => t.id === topicSlug)?.label ?? topicSlug;
}

export function getSubTopicLabel(topicSlug: string, subTopicSlug: string): string {
  const topic = TOPICS_FALLBACK.find((t) => t.id === topicSlug);
  return topic?.subtopics.find((s) => s.id === subTopicSlug)?.label ?? subTopicSlug;
}

// Convert DB topics to the flat Topic[] format used by TopicSelector
export function dbTopicsToFlat(dbTopics: DBTopic[]): Topic[] {
  return dbTopics.map((t) => ({
    id: t.slug,
    label: t.label,
    subtopics: t.subtopics.map((st) => ({
      id: st.slug,
      label: st.label,
    })),
  }));
}
