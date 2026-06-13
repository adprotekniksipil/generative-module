# Setup Supabase + Deploy Vercel

Panduan langkah demi langkah untuk menghubungkan project ini ke Supabase dan deploy ke Vercel.

---

## 1. Buat Supabase Project

1. Buka [supabase.com](https://supabase.com) → New Project
2. Isi nama project, database password (simpan baik-baik!), pilih region terdekat (Singapore)
3. Tunggu project selesai di-provision (~2 menit)

---

## 2. Ambil Credentials

Buka **Project Settings → API**:

| Key | Lokasi |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project API Keys → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Project API Keys → service_role (jangan expose ke client!) |

Buka **Project Settings → Database → Connection string**:
- Pilih **Transaction** mode → copy → ini `DATABASE_URL` (ubah `[YOUR-PASSWORD]`)
- Pilih **Session** mode → copy → ini `DIRECT_URL` (ubah `[YOUR-PASSWORD]`)

Buat file `.env.local` di root project:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres.xxxx:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.xxxx:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
```

---

## 3. Push Schema ke Database

```bash
# Di folder sipil-module-app
npx prisma db push
```

Ini akan membuat semua tabel di Supabase PostgreSQL sesuai `prisma/schema.prisma`.

Verifikasi: Buka Supabase Dashboard → **Table Editor** — harus ada tabel: User, Material, Quiz, Group, dll.

---

## 4. Buat Storage Bucket

1. Buka Supabase Dashboard → **Storage**
2. Klik **New bucket**
3. Nama: `attachments`
4. Centang **Public bucket** (agar file bisa diakses langsung via URL)
5. Klik **Create bucket**

---

## 5. Buat Akun DOSEN Pertama

Register akun biasa hanya membuat MAHASISWA. Setelah register:

1. Buka Supabase Dashboard → **Table Editor** → tabel `User`
2. Cari row dengan email Anda
3. Ubah kolom `role` dari `MAHASISWA` menjadi `DOSEN`
4. Save

Atau via **SQL Editor**:
```sql
UPDATE "User" SET role = 'DOSEN' WHERE email = 'email-anda@example.com';
```

---

## 6. Test Lokal

```bash
npm run dev
```

Buka http://localhost:3000 → login → pastikan bisa masuk ke dashboard.

---

## 7. Deploy ke Vercel

### Push ke GitHub dulu:
```bash
git init
git add .
git commit -m "Initial commit: Vercel + Supabase version"
git remote add origin https://github.com/username/sipil-module-app.git
git push -u origin main
```

### Import di Vercel:
1. Buka [vercel.com](https://vercel.com) → **Add New Project**
2. Import dari GitHub → pilih repo `sipil-module-app`
3. Framework preset: **Next.js** (auto-detected)
4. Buka **Environment Variables** → tambahkan semua dari `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `GOOGLE_GENERATIVE_AI_API_KEY`
5. Klik **Deploy**

### Update Supabase Auth redirect URL:
Setelah dapat URL Vercel (misal `https://sipil-module-app.vercel.app`):
1. Buka Supabase → **Authentication → URL Configuration**
2. **Site URL**: `https://sipil-module-app.vercel.app`
3. **Redirect URLs**: tambahkan `https://sipil-module-app.vercel.app/**`

---

## Troubleshooting

**Error: "relation User does not exist"**
→ Belum push schema. Jalankan `npx prisma db push`

**Login berhasil tapi profile tidak ditemukan**
→ User terdaftar di Supabase Auth tapi tidak ada di tabel `User`. Daftar ulang atau insert manual via SQL Editor.

**File upload gagal**
→ Pastikan bucket `attachments` sudah dibuat dan berstatus **Public**

**Build error di Vercel: "Cannot find module @prisma/adapter-better-sqlite3"**
→ Pastikan `node_modules` di-regenerate setelah uninstall. Vercel install fresh dari `package.json`.
