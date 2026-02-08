# Kop Surat (Letterhead) — MGSULBAR

Setiap surat yang dicetak ke PDF harus memuat **kop surat** sesuai template resmi.

## Sumber template

- **Template resmi:** [docs/Kop Surat MGSULBAR.docx](Kop%20Surat%20MGSULBAR.docx)

Kop surat yang tampil di PDF harus sama dengan desain di dokumen Word tersebut.

## Format (layout)

Format kop mengikuti template docx: **logo di kiri**, **empat baris teks di kanan** (nama organisasi bold, subtitle bold, alamat, telepon/email), lalu **garis pemisah**. Fallback programatik di kode menggunakan layout yang sama.

## Aset untuk PDF

### Gambar kop penuh (opsional)

- **Lokasi aset:** `public/kop-surat-mgsulbar.png`
- **Cara membuat:** Export kop surat dari [docs/Kop Surat MGSULBAR.docx](Kop%20Surat%20MGSULBAR.docx) sebagai gambar (mis. pilih area header/halaman pertama di Word, salin sebagai gambar atau “Save as picture”, simpan sebagai PNG).
- **Memperbarui:** Setiap kali template docx diubah, export ulang dan ganti file `public/kop-surat-mgsulbar.png` agar PDF tetap sesuai template.

Jika file ini **ada**, PDF akan memakai gambar ini di atas halaman (tanpa menggambar kop lewat kode).

### Logo untuk fallback (opsional)

- **Lokasi aset:** `public/logo-mgsulbar.png`
- **Digunakan ketika:** Gambar kop penuh (`kop-surat-mgsulbar.png`) tidak ada; kop digambar dengan format docx (logo kiri, teks kanan). Logo ini dipakai di blok kiri. Jika file tidak ada, blok kiri menampilkan placeholder teks "IA".

### Teks kop (fallback)

Jika gambar kop penuh tidak ada, kop digambar dengan **config teks** di [src/lib/generateLetterPdf.ts](../src/lib/generateLetterPdf.ts): objek `KOP_TEXT` dengan empat field:

- `kopOrgName` — baris 1 (bold, nama organisasi)
- `kopSubtitle` — baris 2 (bold, subtitle/unit)
- `kopAddress` — baris 3 (alamat)
- `kopContact` — baris 4 (telepon | email)

**Agar sesuai docx:** Buka [docs/Kop Surat MGSULBAR.docx](Kop%20Surat%20MGSULBAR.docx) dan salin teks yang tepat ke keempat field tersebut di `generateLetterPdf.ts`.

## Implementasi

- **Generate PDF:** [src/lib/generateLetterPdf.ts](../src/lib/generateLetterPdf.ts)
  - Jika `public/kop-surat-mgsulbar.png` ada: gambar tersebut dipakai di atas halaman.
  - Jika tidak: kop digambar dengan format docx (logo kiri — dari `public/logo-mgsulbar.png` atau placeholder "IA"; empat baris teks kanan dari `KOP_TEXT`); lalu garis pemisah.
