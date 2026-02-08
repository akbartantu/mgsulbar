# Master Plan — MGSULBAR

Blueprint for the MGSULBAR aplikasi surat menyurat untuk sekretariat. This document defines product scope, modules, pages, use cases (workflow + data), and governance. It is the single source of truth for scope; PRD, SRS, sprint-planning, and qa-testing-guide align to it.

---

## 1. Product overview

MGSULBAR is a letter and mail management application for sekretariat (secretariat). Target users are admin and staff who need to manage surat keluar (outgoing mail), surat keputusan (SK), and proposal. The system provides a dashboard with summary statistics, outbox/drafts/approvals/archive views, create-letter flow, and navigation to Database Awardee, Monitoring Program, Keuangan, and Manajemen Anggota. **Current implementation:** frontend uses **mock data** (no login; `currentUser`, `dashboardStats`, `mockLetters` from `src/data/mockData.ts`). Backend and Google Sheets integration exist for future use; auth and API wiring can be added in a later phase.

---

## 2. Current implementation (phase)

| Aspect | Current state |
|--------|----------------|
| **Auth** | No login/register in app routes; UI uses mock `currentUser`. |
| **Data** | Dashboard, Outbox, Drafts, Approvals, Archive, Create letter use mockData (e.g. `getOutboxLetters()`, `getDraftLetters()`, `getPendingApprovalLetters()`, `mockLetters`). |
| **Letter types** | `surat_keluar`, `surat_keputusan`, `proposal` (no surat_masuk in UI). |
| **Branding** | Ikatan Awardee Beasiswa; sidebar logo GraduationCap. |
| **Routes** | `/`, `/outbox`, `/drafts`, `/approvals`, `/archive`, `/create`, `/awardees`, `/programs`, `/finance`, `/members`, `*` (NotFound). |

---

## 3. Module classification

| Module | Description |
|--------|-------------|
| **Dashboard** | Ringkasan statistik (outbox, drafts, awaitingMyApproval dari dashboardStats); Surat Terbaru (mockLetters); Menunggu Persetujuan; Ringkasan Cepat (Awardee Aktif, Program Berjalan, Draft Surat). Module cards link to Surat Menyurat, Database Awardee, Monitoring Program, Keuangan, Anggota. |
| **Surat** | Outbox (surat keluar, SK, proposal), Drafts (status draft), Approvals (pending_approval), Archive (archived/sent). LetterList, LetterCard; Outbox has LetterDetailDialog and SignatureDialog. |
| **Create Surat** | Form: type (Surat Keluar, Surat Keputusan, Proposal), template select, Kepada, Prioritas, Klasifikasi, Approvers, Perihal, Isi Surat (RichTextToolbar), Lampiran. Simpan Draft; Kirim untuk Persetujuan. Approvers from mockData `users`. |
| **Database Awardee** | Page at `/awardees`; placeholder for data penerima beasiswa. |
| **Monitoring Program** | Page at `/programs`; placeholder for tracking kegiatan organisasi. |
| **Keuangan** | Page at `/finance`; placeholder for anggaran dan realisasi. |
| **Manajemen Anggota** | Page at `/members`; placeholder for data anggota organisasi. |

Auth (login/register, JWT, protected routes) and full API/Sheets integration are **planned**; see sections 4–6 for target scope.

---

## 4. Pages per module (current routes)

| Route | Module | Page | Main UI elements |
|-------|--------|------|------------------|
| `/` | Dashboard | Dashboard | Welcome (currentUser.name), module cards (5), Surat Terbaru, Menunggu Persetujuan, Ringkasan Cepat. |
| `/outbox` | Surat | OutboxPage | LetterList, LetterDetailDialog, SignatureDialog; subtitle "Lihat dan kelola surat keluar, undangan, dan nota dinas". |
| `/drafts` | Surat | DraftsPage | LetterList (getDraftLetters()); no edit navigation. |
| `/approvals` | Surat | ApprovalsPage | LetterList (getPendingApprovalLetters()). |
| `/archive` | Surat | ArchivePage | LetterList (mockLetters filtered by archived/sent). |
| `/create` | Create Surat | CreateLetterPage | Type cards (3), Pilih Template (Select), form (Kepada, Prioritas, Klasifikasi, Approvers, Perihal, Isi Surat, Lampiran), Simpan Draft, Kirim untuk Persetujuan. |
| `/awardees` | Database Awardee | AwardeeDatabasePage | Placeholder CTA. |
| `/programs` | Monitoring Program | ProgramMonitoringPage | Placeholder CTA. |
| `/finance` | Keuangan | FinancePage | Placeholder CTA. |
| `/members` | Manajemen Anggota | MembersPage | Placeholder CTA. |
| (sidebar) | All | AppLayout | Grouped nav: Surat Menyurat (Dokumen, Draft, Persetujuan, Arsip, Buat Surat), Database Awardee, Monitoring Program, Keuangan, Manajemen Anggota; user block (currentUser, LogOut icon). |

No protected routes in current build; all pages are directly accessible.

---

## 5. Target scope (auth + API, for future phase)

| Route | Module | Page | Notes |
|-------|--------|------|-------|
| `/login` | Auth | LoginPage | Email, password, "Masuk"; link "Daftar". |
| `/register` | Auth | RegisterPage | Name, email, password, "Daftar"; link "Masuk". |
| `/`, `/outbox`, … | As above | As above | Protected; data from GET /api/dashboard/stats, GET /api/letters, etc. |

Use cases UC-1 (Login), UC-2 (Register), UC-3–UC-10 as in section 6 below apply when backend and auth are wired.

---

## 6. Use cases (workflow + data) — target

### UC-1: Login
- **Actor:** Any (unauthenticated).
- **Main flow:** User opens `/login`, enters email and password, submits. Backend checks ADMIN_EMAIL/ADMIN_PASSWORD (env) or Users sheet; returns JWT and user. Frontend stores token, redirects to `/`.
- **Data:** Read Users sheet (by email). No write.

### UC-2: Register
- **Actor:** Any (unauthenticated).
- **Main flow:** User opens `/register`, enters name, email, password, submits. Backend appends row to Users sheet, returns JWT and user.
- **Data:** Read Users (by email); write Users (append row).

### UC-3: View dashboard
- **Actor:** Authenticated user.
- **Main flow:** User opens `/`. Frontend requests GET /api/dashboard/stats and GET /api/letters. Dashboard renders stat cards and recent letters.
- **Data:** Read Letters sheet.

### UC-4: List letters (Outbox / Drafts / Approvals / Archive)
- **Actor:** Authenticated user.
- **Main flow:** User navigates to `/outbox`, `/drafts`, `/approvals`, or `/archive`. Frontend requests GET /api/letters; page filters by status and displays LetterList.
- **Data:** Read Letters sheet.

### UC-5: View letter detail
- **Actor:** Authenticated user.
- **Main flow:** User clicks a letter in list; LetterDetailDialog opens with subject, content, status, dates, createdBy, actions (Print PDF, Tandatangani, Kirim).
- **Data:** Read Letters (by id or from cached list).

### UC-6: Create letter (draft)
- **Actor:** Authenticated user (creator or admin).
- **Main flow:** User opens `/create`, fills form, clicks "Simpan draft". Frontend POST /api/letters with status draft. Backend appends row to Letters sheet.
- **Data:** Write Letters sheet (append row).

### UC-7: Create letter (submit for approval)
- **Actor:** Authenticated user (creator or admin).
- **Main flow:** User on `/create` fills form, clicks "Kirim untuk Persetujuan". Frontend POST /api/letters with status pending_approval (and approvalSteps). Backend appends row to Letters sheet.
- **Data:** Write Letters sheet (append row).

### UC-8: Update letter
- **Actor:** Authenticated user.
- **Main flow:** User edits letter (e.g. draft), submits. Frontend PATCH /api/letters/:id. Backend updates row in Letters sheet.
- **Data:** Read Letters (by id); write Letters (update row).

### UC-9: Sign letter (outbox)
- **Actor:** Authenticated user.
- **Main flow:** User opens letter, adds signature (SignatureDialog/SignaturePad). Frontend PATCH /api/letters/:id with updated signatures. Backend updates Letters sheet.
- **Data:** Write Letters (update row, signatures field).

### UC-10: List users
- **Actor:** Authenticated user.
- **Main flow:** Frontend requests GET /api/users for dropdowns (e.g. approvers in CreateLetterPage).
- **Data:** Read Users sheet.

---

## 7. Governance rules (target)

| Action | Who |
|--------|-----|
| Login | Any; admin via env credentials, others via Users sheet. |
| Register | Any; new user gets role viewer. |
| View dashboard, list letters, view letter detail | Any authenticated user. |
| Create letter (draft or submit) | Creator/admin (enforceable in future). |
| Update letter | Any authenticated user (refine by role/ownership later). |
| Approve/reject letter | Role approver/admin. |
| List users | Any authenticated user (for dropdowns). |

Roles: `admin | creator | approver | viewer` (see `src/types/mail.ts`).

---

## 8. Data sources (summary)

| Source | Content |
|--------|---------|
| **Users** (sheet / mock) | id, name, email, role, department, avatar, passwordHash. |
| **Letters** (sheet / mock) | id, referenceNumber, type, subject, content, status, priority, classification, from, to, createdAt, updatedAt, createdBy, sentAt, attachments, approvalSteps, statusHistory, signatures, etc. |

**Current:** Mock data in `src/data/mockData.ts` and `src/data/letterTemplates.ts`.  
**Target:** Google Sheets (Users, Letters tabs) via Node.js backend.  
**Kop surat:** Setiap surat yang dicetak ke PDF memuat kop surat dari template [docs/Kop Surat MGSULBAR.docx](Kop%20Surat%20MGSULBAR.docx). Aset gambar: `public/kop-surat-mgsulbar.png` (export dari docx). Detail: [kop-surat.md](kop-surat.md).  
Detail: [erd.md](erd.md). API: [srs.md](srs.md).
