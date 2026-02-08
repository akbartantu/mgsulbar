# Product Requirements Document — MGSULBAR

High-level product vision, goals, personas, features, success criteria, and out-of-scope for the MGSULBAR surat menyurat application. For detailed flows and data, see [master-plan.md](master-plan.md). For requirement IDs and interfaces, see [srs.md](srs.md).

---

## 1. Vision and goals

**Vision:** Digitalisasi surat menyurat sekretariat sehingga surat keluar, surat keputusan, dan proposal dapat dicatat, dilacak, dan diarsipkan dalam satu aplikasi.

**Goals:**

- Mengurangi ketergantungan pada dokumen fisik dan arsip manual.
- Memberikan ringkasan cepat (dashboard) untuk surat keluar, draft, dan yang menunggu persetujuan.
- Memungkinkan pembuatan dan penyimpanan draft surat (Surat Keluar, Surat Keputusan, Proposal) serta pengiriman untuk persetujuan.
- Menyediakan arsip terstruktur (outbox, archive) dengan status yang jelas (draft, pending_approval, sent, archived).
- Mendukung multi-pengguna dengan peran (admin, creator, approver, viewer) dan autentikasi aman (email/kata sandi, JWT) — **target phase**; current UI uses mock data without login.

---

## 2. Current implementation (phase)

The app currently runs **without login**. All data is from **mock data** (`src/data/mockData.ts`, `src/data/letterTemplates.ts`). Routes: `/`, `/outbox`, `/drafts`, `/approvals`, `/archive`, `/create`, `/awardees`, `/programs`, `/finance`, `/members`. Branding: **Ikatan Awardee Beasiswa**. Letter types in UI: **surat_keluar**, **surat_keputusan**, **proposal**. Auth and full API/Sheets integration are planned for a later phase.

---

## 3. User personas

| Persona | Description |
|---------|-------------|
| **Admin sekretariat** | Mengelola akses dan data; login via kredensial env (target); dapat melihat semua surat dan statistik; nantinya mengelola user. |
| **Staff (creator)** | Membuat surat baru (draft), mengisi perihal, penerima, prioritas, klasifikasi; mengirim untuk persetujuan. |
| **Staff (approver)** | Melihat daftar surat menunggu persetujuan; menyetujui atau menolak; (opsional) memberi paraf digital. |
| **Staff (viewer)** | Melihat dashboard, surat keluar, arsip; tidak wajib membuat atau menyetujui surat. |

Registrasi menghasilkan role **viewer** secara default (target phase); admin dapat mengubah peran nanti jika fitur manajemen user ditambahkan.

---

## 4. Features (high-level)

| Feature | Description | Current / Master plan |
|---------|-------------|------------------------|
| **Auth** | Login (email + password; admin via env), register (nama, email, kata sandi), session JWT, role (admin/creator/approver/viewer). | **Target** — not in current routes. |
| **Dashboard** | Ringkasan: outbox, draft, menunggu persetujuan; Surat Terbaru, Menunggu Persetujuan, Ringkasan Cepat; module cards (Surat Menyurat, Database Awardee, Monitoring Program, Keuangan, Anggota). | **Current** — mockData. |
| **Surat keluar (Outbox)** | Daftar surat keluar, SK, proposal; lihat detail; paraf (SignatureDialog). | **Current** — getOutboxLetters(). |
| **Draft** | Daftar surat status draft. | **Current** — getDraftLetters(). |
| **Persetujuan (Approvals)** | Daftar surat status pending_approval. | **Current** — getPendingApprovalLetters(). |
| **Arsip (Archive)** | Daftar surat status archived/sent. | **Current** — mockLetters filter. |
| **Buat surat** | Form: type (Surat Keluar, Surat Keputusan, Proposal), template select, Kepada, Prioritas, Klasifikasi, Approvers, Perihal, Isi Surat, Lampiran; Simpan Draft, Kirim untuk Persetujuan. | **Current** — mockData users as approvers. |
| **Database Awardee / Monitoring Program / Keuangan / Manajemen Anggota** | Placeholder pages dengan CTA. | **Current** — placeholder. |
| **Daftar user** | List user untuk pemilihan approver di form (mockData `users`). | **Current** — mockData. |
| **Export/PDF** | Generate PDF surat (generateLetterPdf). | **Current** — LetterDetailDialog "Cetak PDF". |

---

## 5. Success criteria

**Current phase (mock data):**

- User melihat **dashboard** dengan statistik (outbox, draft, menunggu persetujuan) dan daftar surat dari mock data.
- User dapat **melihat daftar surat** di Outbox, Draft, Persetujuan, dan Arsip.
- User dapat **melihat detail surat** (subject, content, status, tanggal, pembuat) dan aksi Cetak PDF, Tandatangani, Kirim.
- User dapat **membuat surat baru** (type, template, form) dan **Simpan Draft** atau **Kirim untuk Persetujuan** (toast + navigate).
- Aplikasi berbahasa Indonesia; UI responsif (sidebar, mobile).

**Target phase (auth + API):**

- User dapat **login** dan **mendaftar**; data user tersimpan di sheet; session JWT.
- Data persisten di Google Sheets (Users, Letters); session aman (JWT, kata sandi di-hash).
- User dapat **mengubah surat** (e.g. draft) melalui API/UI; approver dapat menyetujui/menolak.

---

## 6. Out of scope (current phase)

- **Notifikasi real-time** (push, WebSocket, email otomatis).
- **Integrasi email** (kirim/terima surat lewat SMTP/IMAP).
- **Aplikasi mobile native** (hanya web; mobile-friendly UI).
- **Manajemen user oleh admin** (CRUD user dari UI).
- **Audit log terpisah** (selain statusHistory di surat).
- **Single Sign-On / OAuth eksternal** (hanya email/password + admin env).
- **Multi-tenant / multi-instansi** (satu sheet per deployment).
- **Surat masuk (Inbox)** — not in current UI; can be added later.

Perubahan scope harus dicerminkan di [master-plan.md](master-plan.md) dan [srs.md](srs.md).
