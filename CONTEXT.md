# sipil-module-app — Konteks Project

## Referensi Source
Project ini adalah versi **Vercel + Firebase** dari aplikasi generatif modul belajar teknik sipil.
Referensi lengkap (versi VPS dengan SQLite + JWT) ada di:
```
C:\Users\kresna\Documents\Claude Project\Aplikasi Generaif Module Balajar Teknik Sipil\frontend\
```
Gunakan folder itu sebagai referensi logika bisnis dan komponen UI.

---

## Apa Aplikasi Ini
Platform berbasis AI untuk dosen teknik sipil dalam membuat materi pembelajaran, kuis, dan RPS (Rencana Pembelajaran Semester). Mahasiswa dapat membaca materi dan mengerjakan kuis.

**Pengguna:**
- **DOSEN** — generate materi, kuis, RPS; kelola kelas (group); nilai mahasiswa
- **MAHASISWA** — baca materi, kerjakan kuis, lihat nilai

---

## Stack Teknis

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | Tailwind CSS v4 + shadcn/ui |
| Database | Firebase Firestore (via Admin SDK) |
| Auth | Firebase Auth (email/password) |
| Storage | Firebase Storage |
| AI | Google Gemini (via Vercel AI SDK) |
| Deploy | Vercel |

---

## Perubahan dari Versi VPS (Penting!)

| Aspek | Versi VPS (referensi) | Versi ini (Vercel + Firebase) |
|-------|----------------------|-------------------------------|
| Database | SQLite (`dev.db`) | Firestore (NoSQL) |
| Auth | JWT custom (`jose` + `bcryptjs`) | Firebase Auth |
| File storage | `public/attachments/` di server | Firebase Storage |
| ORM | Prisma | Firestore Admin SDK helper (`lib/db/firestore.ts`) |
| `User.id` | cuid() | Firebase Auth UID |
| `User.password` | Ada | **Dihapus** (auth di Firebase) |
| Middleware | JWT verify | Cookie `__session` check (Firebase verify di route) |
| Join tables | MaterialGroup, QuizGroup, RPSGroup | `groupIds: string[]` array di dalam dokumen |

---

## Struktur File Penting

```
sipil-module-app/
├── lib/
│   ├── auth.ts                ← Auth helpers (getSession, requireAuth, requireDosen)
│   ├── firebase/
│   │   ├── client.ts          ← Firebase browser client (auth, db, storage)
│   │   └── admin.ts           ← Firebase Admin SDK (adminDb, adminAuth, adminStorage)
│   ├── db/
│   │   ├── types.ts           ← TypeScript interfaces (menggantikan Prisma generated types)
│   │   └── firestore.ts       ← Firestore CRUD helpers + db.* shorthand
│   └── env.ts                 ← Environment variables
├── middleware.ts              ← Route protection (cek cookie __session)
├── app/
│   ├── api/
│   │   ├── auth/              ← login, register, logout, me, profile
│   │   ├── materials/         ← CRUD materi + lampiran (Firebase Storage)
│   │   ├── quizzes/           ← CRUD kuis + attempts + grading
│   │   ├── rps/               ← CRUD RPS + upload file
│   │   ├── groups/            ← CRUD kelas + anggota
│   │   ├── users/             ← Manajemen pengguna (dosen only)
│   │   ├── topics/            ← CRUD topik + subtopik
│   │   ├── grade-matrix/      ← Matriks nilai
│   │   ├── reports/           ← Laporan nilai
│   │   ├── settings/          ← Setting AI usage + grade scale
│   │   ├── generate/          ← AI generation endpoints
│   │   ├── export/            ← PDF, DOCX, MBZ export
│   │   ├── moodle/            ← Moodle API integration
│   │   ├── upload/            ← URL scraping + file text extraction
│   │   └── health/            ← Health check (Firestore ping)
│   ├── (auth)/                ← Halaman login & register
│   ├── (dashboard)/           ← Halaman dosen
│   └── (student)/belajar/     ← Halaman mahasiswa
└── lib/
    └── ai/
        ├── usage-tracker.ts   ← Log AI usage ke Firestore
        └── essay-grader.ts    ← AI grading untuk soal esai
```

---

## Firestore Collections

| Collection | Keterangan |
|-----------|-----------|
| `users` | User profiles (ID = Firebase Auth UID) |
| `groups` | Kelas/kelompok belajar |
| `group_members` | Anggota kelas (userId + groupId) |
| `topics` | Bidang topik teknik sipil |
| `subtopics` | Sub-topik (punya topicId) |
| `materials` | Materi pembelajaran (punya `groupIds: string[]`) |
| `material_attachments` | File lampiran materi |
| `quizzes` | Kuis (punya `groupIds: string[]`) |
| `quiz_attempts` | Hasil pengerjaan kuis mahasiswa |
| `rps` | Rencana Pembelajaran Semester (punya `groupIds: string[]`) |
| `grade_matrices` | Matriks penilaian kelas |
| `grade_components` | Komponen penilaian (UTS, UAS, dll) |
| `grade_students` | Daftar mahasiswa di matriks |
| `grade_scores` | Nilai per komponen per mahasiswa |
| `settings` | Key-value setting (grade_scale, moodle_api_key) |
| `ai_usage_logs` | Log penggunaan AI |

---

## Pola Auth di API Routes

Firebase token dikirim dari client sebagai `Authorization: Bearer <idToken>` atau cookie `__session`.

```typescript
// Cek auth tanpa role
const session = await requireAuth(req);

// Cek auth + hanya dosen  
const session = await requireDosen(req);

// Cek auth, boleh null
const session = await getSessionFromRequest(req);
if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
// session.userId (= Firebase Auth UID), session.email, session.role, session.name
```

**Catatan**: Berbeda dari versi VPS, `req` WAJIB dipass karena token dibaca dari header/cookie.

---

## Firebase Storage

File disimpan di Firebase Storage (bukan server lokal):
- Material attachments: `attachments/{materialId}/{uuid}.{ext}`
- RPS files: `rps/{uuid}.{ext}`

Upload via Admin SDK, file di-makePublic() → URL format:
`https://storage.googleapis.com/{bucket}/{path}`

---

## Cara Buat Akun DOSEN Pertama

Register biasa hanya membuat akun MAHASISWA. Untuk buat DOSEN:
1. Register akun normal (email/password)
2. Buka Firebase Console → Firestore → collection `users`
3. Cari dokumen dengan email dosen → ubah `role` dari `MAHASISWA` ke `DOSEN`

Lihat `FIREBASE_SETUP.md` untuk panduan lengkap setup Firebase.

---

## Deploy ke Vercel

1. Push ke GitHub
2. Import project di vercel.com
3. Set semua environment variables dari `.env.example`
4. Deploy — tidak butuh konfigurasi tambahan
