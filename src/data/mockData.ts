import { Letter, User, DashboardStats, LetterType, LetterStatus } from '@/types/mail';

export const currentUser: User = {
  id: 'u1',
  name: 'Ahmad Wijaya',
  email: 'ahmad.wijaya@company.go.id',
  role: 'approver',
};

export const users: User[] = [
  currentUser,
  {
    id: 'u2',
    name: 'Siti Rahayu',
    email: 'siti.rahayu@company.go.id',
    role: 'creator',
  },
  {
    id: 'u3',
    name: 'Budi Santoso',
    email: 'budi.santoso@company.go.id',
    role: 'admin',
  },
  {
    id: 'u4',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@company.go.id',
    role: 'viewer',
  },
];

export const mockLetters: Letter[] = [
  {
    id: 'L001',
    referenceNumber: 'SK/2024/001/SKR',
    type: 'surat_keluar',
    subject: 'Pemberitahuan Jadwal Rapat Koordinasi Anggaran Tahun 2025',
    content: 'Dengan hormat, kami mengundang Bapak/Ibu untuk menghadiri rapat koordinasi anggaran tahun 2025 yang akan dilaksanakan pada tanggal 15 Januari 2025.',
    status: 'sent',
    priority: 'high',
    classification: 'internal',
    from: 'Kepala Dinas',
    to: 'Kementerian Keuangan RI',
    createdAt: '2024-12-20T09:00:00Z',
    updatedAt: '2024-12-20T09:00:00Z',
    sentAt: '2024-12-20T09:00:00Z',
    createdBy: users[1],
    attachments: [
      { id: 'a1', name: 'Agenda_Rapat.pdf', type: 'application/pdf', size: 245000, url: '#', uploadedAt: '2024-12-20T09:00:00Z' }
    ],
    approvalSteps: [
      { id: 'as0', approver: currentUser, order: 1, status: 'approved', decidedAt: '2024-12-20T08:00:00Z' }
    ],
    statusHistory: [
      { id: 'sh1', status: 'draft', changedBy: users[1], changedAt: '2024-12-19T09:00:00Z' },
      { id: 'sh1b', status: 'approved', changedBy: currentUser, changedAt: '2024-12-20T08:00:00Z' },
      { id: 'sh1c', status: 'sent', changedBy: users[1], changedAt: '2024-12-20T09:00:00Z' }
    ],
  },
  {
    id: 'L002',
    referenceNumber: 'SK/2024/045/KEU',
    type: 'surat_keluar',
    subject: 'Laporan Realisasi Anggaran Triwulan IV 2024',
    content: 'Bersama ini kami sampaikan laporan realisasi anggaran triwulan IV tahun 2024 sebagai bahan evaluasi dan perencanaan anggaran tahun berikutnya.',
    status: 'pending_approval',
    priority: 'normal',
    classification: 'internal',
    from: 'Kepala Dinas',
    to: 'Inspektorat Jenderal',
    createdAt: '2024-12-23T10:30:00Z',
    updatedAt: '2024-12-24T14:00:00Z',
    createdBy: users[1],
    attachments: [
      { id: 'a2', name: 'Laporan_Anggaran_Q4.xlsx', type: 'application/vnd.ms-excel', size: 1250000, url: '#', uploadedAt: '2024-12-23T10:30:00Z' },
      { id: 'a3', name: 'Ringkasan_Eksekutif.pdf', type: 'application/pdf', size: 450000, url: '#', uploadedAt: '2024-12-23T10:35:00Z' }
    ],
    approvalSteps: [
      { id: 'as1', approver: currentUser, order: 1, status: 'pending' }
    ],
    statusHistory: [
      { id: 'sh2', status: 'draft', changedBy: users[1], changedAt: '2024-12-23T10:30:00Z' },
      { id: 'sh3', status: 'pending_approval', changedBy: users[1], changedAt: '2024-12-24T14:00:00Z' }
    ],
  },
  {
    id: 'L003',
    referenceNumber: 'SK/2024/012/SDM',
    type: 'surat_keputusan',
    subject: 'Surat Keputusan Penambahan Tenaga Honorer',
    content: 'Sehubungan dengan meningkatnya beban kerja di unit kami, dengan ini kami mengajukan permohonan penambahan 3 (tiga) tenaga honorer untuk posisi administrasi.',
    status: 'approved',
    priority: 'normal',
    classification: 'internal',
    from: 'Kepala Bagian SDM',
    to: 'Sekretaris Dinas',
    createdAt: '2024-12-18T11:00:00Z',
    updatedAt: '2024-12-22T16:00:00Z',
    sentAt: '2024-12-22T16:30:00Z',
    createdBy: users[3],
    attachments: [],
    approvalSteps: [
      { id: 'as2', approver: currentUser, order: 1, status: 'approved', comment: 'Disetujui untuk 2 tenaga honorer', decidedAt: '2024-12-22T16:00:00Z' }
    ],
    statusHistory: [
      { id: 'sh4', status: 'draft', changedBy: users[3], changedAt: '2024-12-18T11:00:00Z' },
      { id: 'sh5', status: 'pending_approval', changedBy: users[3], changedAt: '2024-12-19T09:00:00Z' },
      { id: 'sh6', status: 'approved', changedBy: currentUser, changedAt: '2024-12-22T16:00:00Z', comment: 'Disetujui untuk 2 tenaga honorer' }
    ],
  },
  {
    id: 'L004',
    referenceNumber: 'SK/2024/008/SKR',
    type: 'surat_keluar',
    subject: 'Undangan Rapat Kerja Tahunan 2025',
    content: 'Dengan hormat, mengundang Bapak/Ibu untuk hadir dalam Rapat Kerja Tahunan guna membahas program kerja tahun 2025.',
    status: 'draft',
    priority: 'high',
    classification: 'internal',
    from: 'Sekretaris Dinas',
    to: 'Seluruh Kepala Bagian',
    createdAt: '2024-12-25T08:00:00Z',
    updatedAt: '2024-12-25T08:00:00Z',
    createdBy: currentUser,
    attachments: [],
    approvalSteps: [],
    statusHistory: [
      { id: 'sh7', status: 'draft', changedBy: currentUser, changedAt: '2024-12-25T08:00:00Z' }
    ],
  },
  {
    id: 'L005',
    referenceNumber: 'SK/2024/044/HKM',
    type: 'surat_keluar',
    subject: 'Tanggapan atas Somasi PT. Maju Jaya',
    content: 'Menanggapi somasi yang dikirimkan oleh PT. Maju Jaya tertanggal 10 Desember 2024, dengan ini kami sampaikan klarifikasi sebagai berikut...',
    status: 'sent',
    priority: 'urgent',
    classification: 'confidential',
    from: 'Kepala Dinas',
    to: 'PT. Maju Jaya',
    createdAt: '2024-12-15T14:00:00Z',
    updatedAt: '2024-12-19T10:00:00Z',
    sentAt: '2024-12-19T10:30:00Z',
    createdBy: users[2],
    attachments: [
      { id: 'a4', name: 'Dokumen_Pendukung.pdf', type: 'application/pdf', size: 890000, url: '#', uploadedAt: '2024-12-15T14:00:00Z' }
    ],
    approvalSteps: [
      { id: 'as3', approver: currentUser, order: 1, status: 'approved', decidedAt: '2024-12-18T11:00:00Z' }
    ],
    statusHistory: [
      { id: 'sh8', status: 'draft', changedBy: users[2], changedAt: '2024-12-15T14:00:00Z' },
      { id: 'sh9', status: 'pending_approval', changedBy: users[2], changedAt: '2024-12-16T09:00:00Z' },
      { id: 'sh10', status: 'approved', changedBy: currentUser, changedAt: '2024-12-18T11:00:00Z' },
      { id: 'sh11', status: 'sent', changedBy: users[2], changedAt: '2024-12-19T10:30:00Z' }
    ],
  },
  {
    id: 'L006',
    referenceNumber: 'SK/2024/002/EKS',
    type: 'surat_keluar',
    subject: 'Permohonan Data Statistik Tahun 2024',
    content: 'Dalam rangka penyusunan laporan tahunan, kami memohon bantuan untuk menyampaikan data statistik pelayanan tahun 2024.',
    status: 'forwarded',
    priority: 'normal',
    classification: 'public',
    from: 'Kepala Dinas',
    to: 'BPS Provinsi',
    createdAt: '2024-12-22T13:00:00Z',
    updatedAt: '2024-12-23T09:00:00Z',
    createdBy: users[1],
    attachments: [],
    approvalSteps: [],
    statusHistory: [
      { id: 'sh12', status: 'draft', changedBy: users[1], changedAt: '2024-12-22T13:00:00Z' },
      { id: 'sh13', status: 'pending_approval', changedBy: users[1], changedAt: '2024-12-23T09:00:00Z', comment: 'Diteruskan ke Bagian Data' }
    ],
  },
];

export const dashboardStats: DashboardStats = {
  inbox: 12,
  outbox: 8,
  drafts: 3,
  pendingApproval: 5,
  awaitingMyApproval: 2,
};

export const getLettersByType = (type: LetterType): Letter[] => {
  return mockLetters.filter(letter => letter.type === type);
};

export const getLettersByStatus = (status: LetterStatus): Letter[] => {
  return mockLetters.filter(letter => letter.status === status);
};

export const getOutboxLetters = (): Letter[] => {
  return mockLetters;
};

export const getDraftLetters = (): Letter[] => {
  return mockLetters.filter(letter => letter.status === 'draft');
};

export const getPendingApprovalLetters = (): Letter[] => {
  return mockLetters.filter(letter => letter.status === 'pending_approval');
};

export const getLetterTypeLabel = (type: LetterType): string => {
  const labels: Record<LetterType, string> = {
    surat_keluar: 'Surat Keluar',
    surat_keputusan: 'Surat Keputusan',
    proposal: 'Proposal',
  };
  return labels[type];
};

export const getStatusLabel = (status: LetterStatus): string => {
  const labels: Record<LetterStatus, string> = {
    draft: 'Draft',
    pending_approval: 'Menunggu Persetujuan',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    revision: 'Perlu Revisi',
    sent: 'Terkirim',
    received: 'Diterima',
    forwarded: 'Diteruskan',
    archived: 'Diarsipkan',
  };
  return labels[status];
};
