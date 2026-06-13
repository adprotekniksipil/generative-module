# Firebase Setup Guide

## 1. Buat Firebase Project

1. Buka [Firebase Console](https://console.firebase.google.com)
2. Klik **Add project** → masukkan nama project
3. Disable Google Analytics (opsional) → **Create project**

## 2. Setup Authentication

1. Sidebar: **Build → Authentication → Get started**
2. Tab **Sign-in method** → enable **Email/Password**
3. Tab **Settings → Authorized domains** → tambah domain Vercel kamu

## 3. Setup Firestore Database

1. Sidebar: **Build → Firestore Database → Create database**
2. Pilih **Start in production mode**
3. Pilih region (misal: `asia-southeast1` untuk Jakarta)
4. Klik **Enable**

### Security Rules Awal

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Semua akses melalui Admin SDK (server-side) — client tidak perlu akses langsung
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 4. Setup Storage

1. Sidebar: **Build → Storage → Get started**
2. Pilih **Start in production mode** → pilih region yang sama dengan Firestore
3. Klik **Done**

### Storage Rules untuk Public Read

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // File attachment dan RPS bisa dibaca publik
    match /attachments/{allPaths=**} {
      allow read: if true;
      allow write: if false; // upload hanya via Admin SDK
    }
    match /rps/{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## 5. Dapatkan Firebase Config

### Client Config (Web App)

1. Project Overview → **Add app** → pilih **Web (</>) **
2. Register app → salin `firebaseConfig`
3. Isi di `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

### Admin SDK Credentials

1. Project Settings (gear icon) → **Service accounts**
2. Klik **Generate new private key** → download JSON
3. Salin nilai-nilai ke `.env.local`:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@...
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
   > **Penting**: Untuk `FIREBASE_PRIVATE_KEY`, wrap dengan tanda kutip ganda dan ganti newline asli dengan `\n`.

## 6. Buat Akun Dosen Pertama

Karena registrasi publik membuat akun MAHASISWA, buat akun dosen via Firebase Auth + Firestore manual:

### Via Firebase Console

1. Authentication → **Add user** → masukkan email & password
2. Salin UID yang baru dibuat
3. Firestore → collection `users` → **Add document** dengan ID = UID tersebut:
   ```json
   {
     "name": "Nama Dosen",
     "email": "dosen@example.com",
     "nim": null,
     "role": "DOSEN",
     "isBlocked": false,
     "createdAt": "2025-01-01T00:00:00.000Z",
     "updatedAt": "2025-01-01T00:00:00.000Z"
   }
   ```

## 7. Environment Variables di Vercel

1. Vercel Dashboard → project → **Settings → Environment Variables**
2. Tambahkan semua variabel dari `.env.example`
3. Untuk `FIREBASE_PRIVATE_KEY`: paste value termasuk tanda kutip `"..."` atau gunakan mode "Sensitive" di Vercel

## 8. Firestore Indexes

Beberapa query membutuhkan composite index. Jalankan app dan klik link error di console Vercel untuk auto-create indexes, atau buat manual di Firebase Console → **Firestore → Indexes → Composite**.

Index yang mungkin dibutuhkan:
- `materials`: `createdById ASC, createdAt DESC`
- `quizzes`: `createdById ASC, createdAt DESC`
- `quiz_attempts`: `quizId ASC, completedAt DESC`
- `grade_matrices`: `createdById ASC, updatedAt DESC`
