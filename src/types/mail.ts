// Letter Types
export type LetterType = 'surat_keluar' | 'surat_keputusan' | 'proposal';

// Status Types
export type LetterStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'revision' 
  | 'sent' 
  | 'received' 
  | 'forwarded' 
  | 'archived';

// User Roles
export type UserRole = 'admin' | 'creator' | 'approver' | 'viewer';

// Priority Levels
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

// Classification
export type Classification = 'public' | 'internal' | 'confidential' | 'secret';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface ApprovalStep {
  id: string;
  approver: User;
  order: number;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  decidedAt?: string;
}

export interface StatusHistory {
  id: string;
  status: LetterStatus;
  changedBy: User;
  changedAt: string;
  comment?: string;
}

export interface Signature {
  id: string;
  signedBy: User;
  signatureDataUrl: string;
  signedAt: string;
}

export interface Letter {
  id: string;
  referenceNumber: string;
  type: LetterType;
  subject: string;
  content: string;
  status: LetterStatus;
  priority: Priority;
  classification: Classification;
  
  // Sender/Receiver
  from: string;
  to: string;
  fromDepartment?: string;
  cc?: string[];
  /** Resolved names for cc (for display); set by backend */
  ccDisplay?: string[];
  
  // Dates
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  receivedAt?: string;
  dueDate?: string;
  
  // Relations
  createdBy: User;
  attachments: Attachment[];
  approvalSteps: ApprovalStep[];
  statusHistory: StatusHistory[];
  
  // Signature
  signatures?: Signature[];
  
  // For Invitation (undangan template)
  eventDate?: string;   // Hari/Tanggal
  eventWaktu?: string;   // Waktu
  eventLocation?: string; // Tempat
  eventAcara?: string;   // Acara
  
  // For Surat Masuk
  dispositionNote?: string;
  forwardedTo?: User[];

  // Isi Surat formatting (display)
  contentJustification?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: string;
  fontFamily?: string;
  fontSize?: number;
}

// Dashboard Stats
export interface DashboardStats {
  inbox: number;
  outbox: number;
  drafts: number;
  pendingApproval: number;
  awaitingMyApproval: number;
}

// Filter Options
export interface LetterFilter {
  type?: LetterType;
  status?: LetterStatus;
  priority?: Priority;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
