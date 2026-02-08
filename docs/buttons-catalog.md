# Buttons catalog — MGSULBAR

List of all buttons in the application by page/component, with label and action. Use for QA and consistency.

---

## AppLayout

| Location | Label / Description | Action |
|----------|---------------------|--------|
| Mobile header | Menu (hamburger) | Opens mobile sidebar. |
| Mobile header | Bell | Placeholder (no handler). |
| Sidebar | Collapse toggle (ChevronLeft) | Toggles sidebar collapsed state. |
| Sidebar | Dashboard | NavLink to `/`. |
| Sidebar | Surat Menyurat (group) | Collapsible; items: Buat Surat → `/create`, Dokumen → `/outbox`, Draft → `/drafts`, Persetujuan → `/approvals`, Arsip → `/archive`. |
| Sidebar | Database Awardee | NavLink to `/awardees`. |
| Sidebar | Monitoring Program | NavLink to `/programs`. |
| Sidebar | Keuangan | NavLink to `/finance`. |
| Sidebar | Manajemen Anggota | NavLink to `/members`. |
| Sidebar footer | LogOut icon | Placeholder (no handler; target: clear token, redirect to login). |

---

## Dashboard

| Location | Label | Action |
|----------|-------|--------|
| Surat Terbaru card | Lihat Semua | Link to `/outbox`. |
| Menunggu Persetujuan card | Lihat Semua | Link to `/approvals`. |
| Module cards (5) | Card click | Link to `/outbox`, `/awardees`, `/programs`, `/finance`, `/members`. |

---

## OutboxPage

| Location | Label | Action |
|----------|-------|--------|
| LetterList | Sort (SortDesc/SortAsc) | Toggles sort order (date). |
| LetterList | Filter | Placeholder (no handler). |
| LetterCard | Card click | Opens LetterDetailDialog (selected letter). |
| LetterCard | Tanda Tangan | Opens SignatureDialog (when canSign and onSign provided). |
| LetterDetailDialog | Cetak PDF | Calls handlePrintPdf (generateLetterPdf). |
| LetterDetailDialog | Tandatangani | Calls onSign(letter). |
| LetterDetailDialog | Kirim | Calls onSend(letter); updates local state, closes dialog, toast. |
| SignatureDialog / SignaturePad | Clear / Batal | Clears canvas. |
| SignatureDialog / SignaturePad | Simpan | Calls onSign(letterId, signatureDataUrl). |

---

## DraftsPage / ApprovalsPage / ArchivePage

| Location | Label | Action |
|----------|-------|--------|
| LetterList | Sort, Filter | Same as OutboxPage (sort toggles; filter placeholder). |
| LetterCard | Card click, Tanda Tangan | Drafts/Approvals: no onLetterClick (no dialog). Archive: LetterList without onLetterClick/onSign in current implementation; if used with onLetterClick/onSign, same as Outbox. |

*Note:* DraftsPage and ApprovalsPage pass LetterList without `onLetterClick` or `onSign`, so letter cards are not clickable and no sign button. ArchivePage same. Only OutboxPage wires LetterList with onLetterClick and onSign.

---

## CreateLetterPage

| Location | Label | Action |
|----------|-------|--------|
| Header | Kembali | navigate(-1). |
| Type cards (3) | Surat Keluar, Surat Keputusan, Proposal | handleTypeChange(type); clears template and subject/content. |
| Template Select | Pilih template | handleTemplateSelect(templateId); fills subject and content. |
| Approvers | Tambah Approver | addApprover() (appends empty slot). |
| Approvers | Trash (per row) | removeApprover(index). |
| Attachments | File input label | Opens file picker; handleFileChange. |
| Attachments | X (per file) | removeAttachment(index). |
| Actions | Simpan Draft | handleSaveDraft(); toast. |
| Actions | Kirim untuk Persetujuan | handleSubmitForApproval(); validation, toast, navigate to /drafts. |
| RichTextToolbar | Bold, Italic, Underline, Bullet, etc. | richText handlers (toggleBold, toggleItalic, etc.). |

---

## AwardeeDatabasePage

| Location | Label | Action |
|----------|-------|--------|
| Header | Tambah Awardee | **Wired:** Toast "Fitur akan segera tersedia" (or open dialog in future). |

---

## ProgramMonitoringPage

| Location | Label | Action |
|----------|-------|--------|
| Header | Tambah Program | **Wired:** Toast "Fitur akan segera tersedia". |

---

## FinancePage

| Location | Label | Action |
|----------|-------|--------|
| Header | Catat Transaksi | **Wired:** Toast "Fitur akan segera tersedia". |

---

## MembersPage

| Location | Label | Action |
|----------|-------|--------|
| Header | Tambah Anggota | **Wired:** Toast "Fitur akan segera tersedia". |

---

## LoginPage / RegisterPage

Not in current app routes. Buttons: "Masuk" (submit login), "Daftar" (submit register); links to register/login. Document when auth is added.

---

## Summary

- **Built and wired:** Dashboard links, OutboxPage (list, detail, sign, send), CreateLetterPage (all form and action buttons), LetterList sort, AppLayout nav and collapse, SignaturePad clear/simpan.
- **Placeholder (no handler):** AppLayout Bell, AppLayout LogOut, LetterList Filter. LogOut and Bell can be wired in auth phase.
- **Placeholder page CTAs:** Tambah Awardee, Tambah Program, Catat Transaksi, Tambah Anggota — wired to toast "Fitur akan segera tersedia" so each button has an action.
