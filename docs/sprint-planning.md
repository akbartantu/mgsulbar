# Sprint Planning — MGSULBAR

Sprint goal, scope, user stories, and acceptance criteria. Aligned with [master-plan.md](master-plan.md); only features defined there appear here. Update this file each sprint (or keep a "current sprint" section and archive past sprints in `docs/sprints/` if preferred).

---

## Current implementation (phase)

The app **does not use login** in current routes. Data is **mock data** (`mockData.ts`, `letterTemplates.ts`). Routes: `/`, `/outbox`, `/drafts`, `/approvals`, `/archive`, `/create`, `/awardees`, `/programs`, `/finance`, `/members`, `*`. Letter types: **surat_keluar**, **surat_keputusan**, **proposal**. Sidebar: Surat Menyurat (Dokumen, Draft, Persetujuan, Arsip, Buat Surat), Database Awardee, Monitoring Program, Keuangan, Manajemen Anggota. User stories below include **target** (auth + API) and **current** (mock) where applicable.

---

## Sprint meta (current)

| Field | Value |
|-------|--------|
| **Sprint number** | 1 (baseline) |
| **Goal** | Core UI with mock data: dashboard, outbox/drafts/approvals/archive, create letter, placeholder pages (awardees, programs, finance, members). Auth and API integration are target for next phase. |
| **Duration** | As needed (e.g. 2 weeks). |
| **Scope (modules)** | Dashboard, Surat (Outbox, Drafts, Approvals, Archive), Create Surat, placeholder modules (Awardees, Programs, Finance, Members). Auth and Users (read-only API) are target. |

---

## User stories

### US-1.1 — Login

**As a** user (admin or staff), **I want to** log in with email and password **so that** I can access the application.

**Acceptance criteria:**

- AC-1.1.1: User can open `/login`, enter email and password, and submit.
- AC-1.1.2: If credentials match admin env (ADMIN_EMAIL, ADMIN_PASSWORD), user receives JWT and is redirected to dashboard.
- AC-1.1.3: If credentials match a user in Users sheet (email + passwordHash), user receives JWT and is redirected to dashboard.
- AC-1.1.4: If credentials are invalid, system shows "Invalid credentials" and does not redirect.
- AC-1.1.5: Link "Belum punya akun? Daftar" leads to `/register`.

**Master plan:** UC-1.

---

### US-1.2 — Register

**As a** visitor, **I want to** register with name, email, and password **so that** I can get an account and log in.

**Acceptance criteria:**

- AC-1.2.1: User can open `/register`, enter name, email, password, and submit.
- AC-1.2.2: If email is not already in Users sheet, system creates user (role viewer), returns JWT, and user can access app.
- AC-1.2.3: If email already exists, system returns error (e.g. "Email already registered") and does not create duplicate.
- AC-1.2.4: Link "Sudah punya akun? Masuk" leads to `/login`.

**Master plan:** UC-2.

---

### US-1.3 — View dashboard

**As an** authenticated user, **I want to** see a dashboard with summary statistics and recent letters **so that** I have an overview of surat keluar, draft, and persetujuan.

**Acceptance criteria:**

- AC-1.3.1: User opens `/` (dashboard). **Current:** No login; direct access.
- AC-1.3.2: Dashboard shows module cards (Surat Menyurat, Database Awardee, Monitoring Program, Keuangan, Anggota) and stat values; Surat Terbaru; Menunggu Persetujuan; Ringkasan Cepat. **Current:** Data from dashboardStats, mockLetters.
- AC-1.3.3: Dashboard shows recent letters and pending approvals. **Current:** mockLetters slice/filter.
- AC-1.3.4: Sidebar shows navigation to Dokumen (Outbox), Draft, Persetujuan, Arsip, Buat Surat, Database Awardee, Monitoring Program, Keuangan, Manajemen Anggota. **Current:** AppLayout grouped nav.

**Master plan:** UC-3.

---

### US-1.4 — List letters (Outbox / Drafts / Approvals / Archive)

**As an** authenticated user, **I want to** view lists of letters by status **so that** I can find surat keluar, draft, menunggu persetujuan, and arsip.

**Acceptance criteria:**

- AC-1.4.1: `/outbox` shows letters (surat_keluar, surat_keputusan, proposal). **Current:** getOutboxLetters() (mockLetters).
- AC-1.4.2: `/drafts` shows letters with status draft. **Current:** getDraftLetters().
- AC-1.4.3: `/approvals` shows letters with status pending_approval. **Current:** getPendingApprovalLetters().
- AC-1.4.4: `/archive` shows letters with status archived or sent. **Current:** mockLetters filter.
- AC-1.4.5: **Target:** Each list uses GET /api/letters; frontend filters by status.

**Master plan:** UC-4.

---

### US-1.5 — View letter detail

**As an** authenticated user, **I want to** open a letter from a list and see its full detail **so that** I can read subject, content, status, dates, and creator.

**Acceptance criteria:**

- AC-1.5.1: Clicking a letter in a list opens a detail view (e.g. LetterDetailDialog) with subject, content, status, dates, createdBy.
- AC-1.5.2: Data comes from GET /api/letters/:id or from cached list.

**Master plan:** UC-5.

---

### US-1.6 — Create letter (draft or submit)

**As an** authenticated user, **I want to** create a new surat (Surat Keluar, Surat Keputusan, Proposal) and either save as draft or submit for approval **so that** surat can be tracked and approved.

**Acceptance criteria:**

- AC-1.6.1: User can open `/create`, select type (Surat Keluar, Surat Keputusan, Proposal), choose template (Select), fill Kepada, Prioritas, Klasifikasi, Approvers, Perihal, Isi Surat, Lampiran. **Current:** mockData users for approvers.
- AC-1.6.2: "Simpan draft" shows success toast. **Target:** POST /api/letters with status draft.
- AC-1.6.3: "Kirim untuk Persetujuan" shows success toast and navigates to /drafts. **Target:** POST /api/letters with status pending_approval.
- AC-1.6.4: **Target:** Created letter has id, createdAt, updatedAt, createdBy (current user).

**Master plan:** UC-6, UC-7.

---

### US-1.7 — Update letter

**As an** authenticated user, **I want to** update an existing letter (e.g. draft) **so that** I can correct or complete it before sending.

**Acceptance criteria:**

- AC-1.7.1: User can update letter via PATCH /api/letters/:id with partial body; backend returns updated letter.
- AC-1.7.2: If letter id does not exist, backend returns 404.

**Master plan:** UC-8.

---

### US-1.8 — List users

**As an** authenticated user, **I want to** see a list of users **so that** I can select penerima or approver when creating/editing surat (if UI supports it).

**Acceptance criteria:**

- AC-1.8.1: GET /api/users returns list of users (id, name, email, role, department); no passwordHash.
- AC-1.8.2: CreateLetterPage (or other UI) can use this list for dropdowns if needed.

**Master plan:** UC-10.

---

## Backlog (optional)

| ID | Title | Priority |
|----|--------|----------|
| US-1.1 | Login | Must |
| US-1.2 | Register | Must |
| US-1.3 | View dashboard | Must |
| US-1.4 | List letters (Inbox/Outbox/Drafts/Approvals/Archive) | Must |
| US-1.5 | View letter detail | Must |
| US-1.6 | Create letter (draft or submit) | Must |
| US-1.7 | Update letter | Must |
| US-1.8 | List users | Should |

---

## Definition of done

- Code merged to main (or target branch); CI (lint, build) passes.
- Documentation (master-plan, PRD, SRS, ERD, sprint-planning, qa-testing-guide) updated if scope or behavior changed.
- No critical (P0/P1) bugs open for the sprint scope.
- Test cases in [qa-testing-guide.md](qa-testing-guide.md) executed and signed off (or documented exceptions).
