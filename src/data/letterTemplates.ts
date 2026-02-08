import { LetterType } from '@/types/mail';

export interface LetterTemplate {
  id: string;
  type: LetterType;
  name: string;
  description: string;
  subject: string;
  content: string;
}

export const letterTemplates: LetterTemplate[] = [
  // Surat Keluar Templates
  {
    id: 'sk-permohonan',
    type: 'surat_keluar',
    name: 'Permohonan Resmi',
    description: 'Template untuk surat permohonan resmi kepada instansi atau pihak lain',
    subject: 'Permohonan [Isi Perihal]',
    content: `Dengan hormat,

Sehubungan dengan [jelaskan latar belakang], dengan ini kami mengajukan permohonan [jelaskan permohonan].

Adapun hal-hal yang kami mohon adalah sebagai berikut:
1. [Poin pertama]
2. [Poin kedua]
3. [Poin ketiga]

Sebagai bahan pertimbangan, bersama ini kami lampirkan dokumen-dokumen pendukung sebagai berikut:
1. [Lampiran 1]
2. [Lampiran 2]

Demikian permohonan ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.

Hormat kami,`,
  },
  {
    id: 'sk-pemberitahuan',
    type: 'surat_keluar',
    name: 'Pemberitahuan',
    description: 'Template untuk surat pemberitahuan resmi',
    subject: 'Pemberitahuan [Isi Perihal]',
    content: `Dengan hormat,

Melalui surat ini, kami bermaksud memberitahukan kepada Bapak/Ibu mengenai [hal yang diberitahukan].

Adapun informasi yang perlu disampaikan adalah sebagai berikut:

1. [Informasi pertama]
2. [Informasi kedua]
3. [Informasi ketiga]

Kami harap Bapak/Ibu dapat [tindakan yang diharapkan].

Demikian pemberitahuan ini kami sampaikan. Atas perhatiannya, kami ucapkan terima kasih.

Hormat kami,`,
  },
  {
    id: 'sk-undangan',
    type: 'surat_keluar',
    name: 'Undangan Rapat',
    description: 'Template untuk undangan rapat atau acara',
    subject: 'Undangan [Nama Acara]',
    content: `Dengan hormat,

Dalam rangka [tujuan acara], kami mengundang Bapak/Ibu untuk hadir pada:

{{EVENT_DETAILS}}

Agenda acara:
1. [Agenda 1]
2. [Agenda 2]
3. [Agenda 3]

Mengingat pentingnya acara ini, kami mohon kesediaan Bapak/Ibu untuk hadir tepat waktu.

Demikian undangan ini kami sampaikan. Atas kehadiran Bapak/Ibu, kami ucapkan terima kasih.

Hormat kami,`,
  },

  // Surat Keputusan Templates
  {
    id: 'skep-pengangkatan',
    type: 'surat_keputusan',
    name: 'Pengangkatan Jabatan',
    description: 'Template untuk surat keputusan pengangkatan jabatan',
    subject: 'Surat Keputusan Pengangkatan [Jabatan]',
    content: `SURAT KEPUTUSAN
Nomor: [Nomor SK]

TENTANG
PENGANGKATAN [JABATAN]

[NAMA PEJABAT PENANDA TANGAN]

Menimbang:
a. bahwa [pertimbangan pertama];
b. bahwa [pertimbangan kedua];
c. bahwa [pertimbangan ketiga].

Mengingat:
1. [Dasar hukum pertama];
2. [Dasar hukum kedua];
3. [Dasar hukum ketiga].

MEMUTUSKAN

Menetapkan:

PERTAMA  : Mengangkat [Nama Lengkap], [NIP/NIK], sebagai [Jabatan] terhitung mulai tanggal [tanggal efektif].

KEDUA    : [Ketentuan kedua tentang tugas dan tanggung jawab].

KETIGA   : Segala biaya yang timbul akibat pelaksanaan Keputusan ini dibebankan pada [sumber anggaran].

KEEMPAT  : Keputusan ini berlaku sejak tanggal ditetapkan dengan ketentuan apabila di kemudian hari terdapat kekeliruan akan diadakan perbaikan sebagaimana mestinya.

Ditetapkan di: [Kota]
Pada tanggal : [Tanggal]`,
  },
  {
    id: 'skep-pembentukan-tim',
    type: 'surat_keputusan',
    name: 'Pembentukan Tim',
    description: 'Template untuk surat keputusan pembentukan tim kerja',
    subject: 'Surat Keputusan Pembentukan Tim [Nama Tim]',
    content: `SURAT KEPUTUSAN
Nomor: [Nomor SK]

TENTANG
PEMBENTUKAN TIM [NAMA TIM]

[NAMA PEJABAT PENANDA TANGAN]

Menimbang:
a. bahwa dalam rangka [tujuan pembentukan tim];
b. bahwa untuk kelancaran pelaksanaan [kegiatan terkait];
c. bahwa sehubungan dengan hal tersebut perlu membentuk Tim [Nama Tim].

Mengingat:
1. [Dasar hukum pertama];
2. [Dasar hukum kedua].

MEMUTUSKAN

Menetapkan:

PERTAMA  : Membentuk Tim [Nama Tim] dengan susunan keanggotaan sebagai berikut:

Pengarah     : [Nama - Jabatan]
Ketua        : [Nama - Jabatan]
Sekretaris   : [Nama - Jabatan]
Anggota      : 1. [Nama - Jabatan]
               2. [Nama - Jabatan]
               3. [Nama - Jabatan]

KEDUA    : Tim sebagaimana dimaksud dalam diktum PERTAMA bertugas:
            a. [Tugas pertama];
            b. [Tugas kedua];
            c. [Tugas ketiga].

KETIGA   : Masa tugas Tim adalah [durasi] terhitung sejak tanggal ditetapkan.

KEEMPAT  : Keputusan ini berlaku sejak tanggal ditetapkan.

Ditetapkan di: [Kota]
Pada tanggal : [Tanggal]`,
  },

  // Proposal Templates
  {
    id: 'prop-kegiatan',
    type: 'proposal',
    name: 'Proposal Kegiatan',
    description: 'Template untuk proposal kegiatan atau acara',
    subject: 'Proposal Kegiatan [Nama Kegiatan]',
    content: `PROPOSAL KEGIATAN
[NAMA KEGIATAN]

I. PENDAHULUAN

A. Latar Belakang
[Jelaskan latar belakang kegiatan, mengapa kegiatan ini perlu dilaksanakan, dan konteks yang relevan]

B. Dasar Pelaksanaan
1. [Dasar hukum atau kebijakan]
2. [Dasar pelaksanaan lainnya]

II. TUJUAN DAN SASARAN

A. Tujuan
1. [Tujuan pertama]
2. [Tujuan kedua]

B. Sasaran
1. [Sasaran pertama]
2. [Sasaran kedua]

III. PELAKSANAAN

A. Nama Kegiatan  : [Nama Kegiatan]
B. Waktu         : [Tanggal dan Jam]
C. Tempat        : [Lokasi]
D. Peserta       : [Jumlah dan kriteria peserta]

IV. SUSUNAN PANITIA

Penanggung Jawab : [Nama]
Ketua Panitia    : [Nama]
Sekretaris       : [Nama]
Bendahara        : [Nama]
Seksi-seksi      : [Nama dan seksi]

V. ANGGARAN BIAYA

[Rincian anggaran atau lihat lampiran]

Total Anggaran: Rp [Jumlah]

VI. PENUTUP

Demikian proposal ini kami susun. Atas perhatian dan dukungannya, kami ucapkan terima kasih.`,
  },
  {
    id: 'prop-anggaran',
    type: 'proposal',
    name: 'Proposal Anggaran',
    description: 'Template untuk proposal permintaan anggaran',
    subject: 'Proposal Pengajuan Anggaran [Nama Program]',
    content: `PROPOSAL PENGAJUAN ANGGARAN
[NAMA PROGRAM/KEGIATAN]
TAHUN [TAHUN]

I. PENDAHULUAN

[Jelaskan latar belakang pengajuan anggaran dan urgensi program/kegiatan]

II. MAKSUD DAN TUJUAN

A. Maksud
[Jelaskan maksud dari pengajuan anggaran ini]

B. Tujuan
1. [Tujuan pertama]
2. [Tujuan kedua]
3. [Tujuan ketiga]

III. SASARAN DAN MANFAAT

A. Sasaran
[Jelaskan sasaran yang ingin dicapai]

B. Manfaat
1. [Manfaat pertama]
2. [Manfaat kedua]

IV. RINCIAN ANGGARAN

No.  | Uraian                    | Volume | Satuan    | Harga Satuan | Jumlah
-----|---------------------------|--------|-----------|--------------|--------
1.   | [Item anggaran 1]         | [...]  | [...]     | Rp [...]     | Rp [...]
2.   | [Item anggaran 2]         | [...]  | [...]     | Rp [...]     | Rp [...]
3.   | [Item anggaran 3]         | [...]  | [...]     | Rp [...]     | Rp [...]

TOTAL ANGGARAN: Rp [Jumlah Total]

V. JADWAL PELAKSANAAN

[Uraikan jadwal pelaksanaan program/kegiatan]

VI. PENUTUP

Demikian proposal pengajuan anggaran ini kami sampaikan. Besar harapan kami agar proposal ini dapat disetujui. Atas perhatian dan persetujuannya, kami ucapkan terima kasih.`,
  },
];

export const getTemplatesByType = (type: LetterType): LetterTemplate[] => {
  return letterTemplates.filter(t => t.type === type);
};

export const getTemplateById = (id: string): LetterTemplate | undefined => {
  return letterTemplates.find(t => t.id === id);
};
