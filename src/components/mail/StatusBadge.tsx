import { LetterStatus, Priority, LetterType } from '@/types/mail';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Mail, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Archive,
  Forward,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: LetterStatus;
}

const statusConfig: Record<LetterStatus, { label: string; variant: 'draft' | 'pending' | 'approved' | 'rejected' | 'sent' | 'archived' | 'received'; icon: React.ReactNode }> = {
  draft: { label: 'Draft', variant: 'draft', icon: <FileText className="h-3 w-3" /> },
  pending_approval: { label: 'Menunggu Persetujuan', variant: 'pending', icon: <Clock className="h-3 w-3" /> },
  approved: { label: 'Disetujui', variant: 'approved', icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: 'Ditolak', variant: 'rejected', icon: <XCircle className="h-3 w-3" /> },
  revision: { label: 'Perlu Revisi', variant: 'pending', icon: <AlertCircle className="h-3 w-3" /> },
  sent: { label: 'Terkirim', variant: 'sent', icon: <Send className="h-3 w-3" /> },
  received: { label: 'Diterima', variant: 'received', icon: <Mail className="h-3 w-3" /> },
  forwarded: { label: 'Diteruskan', variant: 'sent', icon: <Forward className="h-3 w-3" /> },
  archived: { label: 'Diarsipkan', variant: 'archived', icon: <Archive className="h-3 w-3" /> },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityConfig: Record<Priority, { label: string; variant: 'urgent' | 'high' | 'normal' | 'low'; icon?: React.ReactNode }> = {
  urgent: { label: 'Sangat Penting', variant: 'urgent', icon: <AlertTriangle className="h-3 w-3" /> },
  high: { label: 'Penting', variant: 'high' },
  normal: { label: 'Normal', variant: 'normal' },
  low: { label: 'Rendah', variant: 'low' },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

interface LetterTypeBadgeProps {
  type: LetterType;
}

const typeConfig: Record<LetterType, { label: string; icon: React.ReactNode }> = {
  surat_keluar: { label: 'Surat Keluar', icon: <Send className="h-3 w-3" /> },
  surat_keputusan: { label: 'Surat Keputusan', icon: <FileText className="h-3 w-3" /> },
  proposal: { label: 'Proposal', icon: <FileText className="h-3 w-3" /> },
};

export function LetterTypeBadge({ type }: LetterTypeBadgeProps) {
  const config = typeConfig[type];
  return (
    <Badge variant="outline" className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}
