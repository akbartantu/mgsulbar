# QA Testing Guide — MGSULBAR

Step-by-step test cases for QA testers, aligned with [sprint-planning.md](sprint-planning.md) user stories (US-x.y) and test case IDs (TC-x.y.z). Use for sprint or full regression.

---

## 1. Overview

**Purpose:** Verify that MGSULBAR behaves as specified in the SRS and sprint planning (dashboard, surat lists, letter detail, create letter, placeholder pages). **Target phase** adds login, register, and API-backed data.

**Current implementation:** App runs **without login**. Data is **mock data** (`mockData.ts`, `letterTemplates.ts`). Routes: `/`, `/outbox`, `/drafts`, `/approvals`, `/archive`, `/create`, `/awardees`, `/programs`, `/finance`, `/members`, `*`. Letter types: surat_keluar, surat_keputusan, proposal. Sidebar: Surat Menyurat (Dokumen, Draft, Persetujuan, Arsip, Buat Surat), Database Awardee, Monitoring Program, Keuangan, Manajemen Anggota.

**Scope:** Current sprint: Dashboard, Surat (Outbox, Drafts, Approvals, Archive), Create Surat, placeholder pages. Auth and API-backed lists are **target**.

**Environment:** Local development: frontend default `http://localhost:8080`, backend optional (default `http://localhost:3001`). For **current** UI-only testing, backend is not required; mock data is used.

---

## 2. Environment setup

**Current (UI with mock data):**

1. Clone the repository.
2. Root: `npm install`.
3. From root: `npm run dev`.
4. Open browser to `http://localhost:5173` (or port shown by Vite). No backend or login required; all data is mock.

**Target (with backend and auth):**

- Node.js (LTS) and npm installed.
- Google Sheets: one spreadsheet shared with the service account (Editor); SPREADSHEET_ID set in `server/.env`.
- Backend env: `server/.env` with GOOGLE_SHEETS_CREDENTIALS, SPREADSHEET_ID, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, FRONTEND_URL.
- Frontend env: root `.env` with VITE_API_URL (e.g. http://localhost:3001).
- Root: `npm install`; `cd server && npm install`; start backend (`npm run dev`); from root start frontend (`npm run dev`); open `http://localhost:8080` (or configured port). Use admin credentials or register for login.

---

## 3. Test cases by user story

### US-1.1 — Login (target; not in current routes)

| ID | Title | Steps | Expected result |
|----|--------|--------|------------------|
| TC-1.1.1 | Login with admin (env) | 1. Open `/login`. 2. Enter ADMIN_EMAIL and ADMIN_PASSWORD from server/.env. 3. Click "Masuk". | User is logged in; redirected to `/` (dashboard); sidebar shows user name. |
| TC-1.1.2 | Login with registered user | 1. Ensure user exists in Users sheet (e.g. via Register). 2. Open `/login`. 3. Enter email and password. 4. Click "Masuk". | User is logged in; redirected to `/`; sidebar shows user name. |
| TC-1.1.3 | Login with invalid credentials | 1. Open `/login`. 2. Enter wrong email or password. 3. Click "Masuk". | Error "Invalid credentials" shown; user stays on login page. |
| TC-1.1.4 | Navigate to register | 1. Open `/login`. 2. Click "Belum punya akun? Daftar". | Browser navigates to `/register`. |

**Current:** `/login` and `/register` are not in app routes; skip these until auth is added.

---

### US-1.2 — Register (target; not in current routes)

| ID | Title | Steps | Expected result |
|----|--------|--------|------------------|
| TC-1.2.1 | Register new user | 1. Open `/register`. 2. Enter name, email (new), password. 3. Click "Daftar". | User is created in Users sheet; JWT returned; user logged in; can redirect to `/`. |
| TC-1.2.2 | Register with existing email | 1. Open `/register`. 2. Enter email that already exists in Users sheet. 3. Click "Daftar". | Error (e.g. "Email already registered"); user not created. |
| TC-1.2.3 | Navigate to login | 1. Open `/register`. 2. Click "Sudah punya akun? Masuk". | Browser navigates to `/login`. |

**Current:** Skip; no register route.

---

### US-1.3 — View dashboard

| ID | Title | Steps | Expected result |
|----|--------|--------|------------------|
| TC-1.3.1 | Dashboard load | 1. Open `/` (dashboard). **Current:** No login. | Welcome text (currentUser.name), 5 module cards (Surat Menyurat, Database Awardee, Monitoring Program, Keuangan, Anggota), Surat Terbaru, Menunggu Persetujuan (if any), Ringkasan Cepat. |
| TC-1.3.2 | Dashboard data | 1. Open `/`. 2. **Current:** Data from mockData (dashboardStats, mockLetters). **Target:** DevTools Network shows GET /api/dashboard/stats and GET /api/letters. | **Current:** No API calls; UI shows mock counts and letters. **Target:** 200 with stats and letters array. |
| TC-1.3.3 | Sidebar navigation | 1. On dashboard. 2. Click Dokumen (Outbox), Draft, Persetujuan, Arsip, Buat Surat; expand Surat Menyurat if collapsed. 3. Click Database Awardee, Monitoring Program, Keuangan, Manajemen Anggota. | Each navigates to /outbox, /drafts, /approvals, /archive, /create, /awardees, /programs, /finance, /members. |

---

### US-1.4 — List letters (Outbox / Drafts / Approvals / Archive)

| ID | Title | Steps | Expected result |
|----|--------|--------|------------------|
| TC-1.4.1 | Outbox list | 1. Go to `/outbox`. | Letters from getOutboxLetters() (mockLetters). Subtitle: "Lihat dan kelola surat keluar, undangan, dan nota dinas". |
| TC-1.4.2 | Drafts list | 1. Go to `/drafts`. | Only letters with status draft (getDraftLetters()). Empty message if none. |
| TC-1.4.3 | Approvals list | 1. Go to `/approvals`. | Only letters with status pending_approval (getPendingApprovalLetters()). |
| TC-1.4.4 | Archive list | 1. Go to `/archive`. | Letters with status archived or sent (mockLetters filter). |
| TC-1.4.5 | List pages load | 1. Visit /outbox, /drafts, /approvals, /archive. | Each page loads; no crash. **Current:** No API; mock data. **Target:** No 401 on GET /api/letters. |

---

### US-1.5 — View letter detail

| ID | Title | Steps | Expected result |
|----|--------|--------|------------------|
| TC-1.5.1 | Open letter detail | 1. Go to `/outbox` (has letters in mock data). 2. Click a letter. | LetterDetailDialog opens with subject, content, status, dates, createdBy; actions: Cetak PDF, Tandatangani, Kirim. |
| TC-1.5.2 | Letter not found | **Target:** Request GET /api/letters/nonexistent-id. | Backend returns 404 "Letter not found". **Current:** N/A (no direct API call from UI). |

---

### US-1.6 — Create letter (draft or submit)

| ID | Title | Steps | Expected result |
|----|--------|--------|------------------|
| TC-1.6.1 | Create draft | 1. Go to `/create`. 2. Select type (Surat Keluar, Surat Keputusan, or Proposal). 3. Optionally choose template (Select). 4. Fill Kepada, Perihal, Isi Surat; set Prioritas, Klasifikasi; add at least one Approver. 5. Click "Simpan draft". | **Current:** Toast "Draft Tersimpan". **Target:** POST /api/letters with status draft; letter in Drafts list. |
| TC-1.6.2 | Create and submit | 1. Go to `/create`. 2. Fill form (Kepada, Perihal, Isi Surat, at least one Approver). 3. Click "Kirim untuk Persetujuan". | **Current:** Toast "Surat Terkirim untuk Persetujuan"; navigate to /drafts. **Target:** POST /api/letters with status pending_approval; letter in Approvals list. |
| TC-1.6.3 | Validation | 1. Go to `/create`. 2. Leave Kepada or Perihal or Isi Surat empty; click "Kirim untuk Persetujuan". 3. Leave approvers empty; click "Kirim untuk Persetujuan". | Toast "Data Tidak Lengkap" or "Pilih Approver" (variant destructive). |

---

### US-1.7 — Update letter

| ID | Title | Steps | Expected result |
|----|--------|--------|------------------|
| TC-1.7.1 | Update letter via API | 1. Log in. 2. Create or pick a letter id. 3. Send PATCH /api/letters/:id with { subject: "Updated subject" }. | 200 with updated letter; subject changed in response and in Letters sheet. |
| TC-1.7.2 | Update non-existent letter | 1. Log in. 2. Send PATCH /api/letters/nonexistent-id. | 404 "Letter not found". |

---

### US-1.8 — List users

| ID | Title | Steps | Expected result |
|----|--------|--------|------------------|
| TC-1.8.1 | Get users list | 1. Log in. 2. Open CreateLetterPage or call GET /api/users (e.g. via DevTools). | 200 with array of users; each has id, name, email, role, department; no passwordHash. |

---

## 4. Cross-cutting

| ID | Title | Steps | Expected result |
|----|--------|--------|------------------|
| TC-X.1 | Logout | **Target:** 1. Log in. 2. Click logout (sidebar). | Token cleared; redirect to `/login`. **Current:** Logout icon in sidebar (no redirect; no auth). |
| TC-X.2 | Session expiry / invalid token | **Target:** 1. Log in. 2. Remove/corrupt sessionStorage key. 3. Navigate or refresh. | Redirect to `/login`. **Current:** N/A. |
| TC-X.3 | Direct route access | 1. Open `/`, `/outbox`, `/drafts`, `/approvals`, `/archive`, `/create`, `/awardees`, `/programs`, `/finance`, `/members` directly. | **Current:** All load without login. **Target:** Unauthenticated access to protected routes redirects to `/login`. |
| TC-X.4 | Health check | **Target:** GET http://localhost:3001/api/health (no auth). | 200 with { ok: true, timestamp }. **Current:** Backend optional. |

---

## 5. Completion criteria

- **Current scope:** Execute TC-1.3.x, TC-1.4.x, TC-1.5.1, TC-1.6.x, TC-X.3. Skip TC-1.1, TC-1.2, TC-1.7, TC-1.8, TC-X.1, TC-X.2, TC-X.4 until auth/API are wired.
- **Target scope:** All test cases TC-1.1.1–TC-1.8.1 and TC-X.1–TC-X.4 executed.
- Results recorded (Pass/Fail); failures documented in [troubleshooting-guide.md](troubleshooting-guide.md) or bug tracker.
- No P0/P1 bugs open for the scope of this guide.
- Optional: sign-off table (tester, date, scope) for audit.
