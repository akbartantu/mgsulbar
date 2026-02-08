import React from 'react';
import { Letter } from '@/types/mail';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge, LetterTypeBadge } from './StatusBadge';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { MapPin, FileCheck, Clock, CheckCircle2, XCircle, Circle } from 'lucide-react';
import { ContentPreview } from './ContentPreview';

interface LacakSuratDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letter: Letter | null;
}

function getLetterLocation(letter: Letter): { text: string; pendingFrom?: string } {
  if (letter.status === 'draft') return { text: 'Draft' };
  if (letter.status === 'approved' || letter.status === 'sent') return { text: 'Disetujui' };
  if (letter.status === 'revision') return { text: 'Dikembalikan untuk revisi' };
  if (letter.status === 'rejected') return { text: 'Ditolak / Dibatalkan' };
  if (letter.status === 'pending_approval' && letter.approvalSteps?.length) {
    const pendingIndex = letter.approvalSteps.findIndex((s) => s.status === 'pending');
    const pending = pendingIndex >= 0 ? letter.approvalSteps[pendingIndex] : undefined;
    if (pending) {
      const name = pending.approver?.name;
      const text = name
        ? `Menunggu Persetujuan dari ${name}`
        : `Menunggu Persetujuan dari Approver ke-${pendingIndex + 1}`;
      return { text, pendingFrom: name };
    }
  }
  return { text: 'Menunggu persetujuan' };
}

function getDisplayReferenceNumber(letter: Letter): string {
  if (letter.status === 'approved' || letter.status === 'sent') {
    return letter.referenceNumber?.trim() || '—';
  }
  return 'Akan diberikan setelah disetujui';
}

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  pending_approval: 'Menunggu persetujuan',
  approved: 'Disetujui',
  revision: 'Revisi',
  rejected: 'Ditolak',
  sent: 'Terkirim',
};

export function LacakSuratDialog({
  open,
  onOpenChange,
  letter,
}: LacakSuratDialogProps) {
  const isMobile = useIsMobile();

  if (!letter) return null;

  const location = getLetterLocation(letter);
  const displayRef = getDisplayReferenceNumber(letter);
  const isProposal = letter.type === 'proposal';
  let proposalFields: { latarBelakang?: string; tujuan?: string; anggaran?: string; timeline?: string } = {};
  if (isProposal && letter.content) {
    try {
      proposalFields = JSON.parse(letter.content);
    } catch {
      proposalFields = {};
    }
  }
  const pendingIndex = letter.approvalSteps?.findIndex((s) => s.status === 'pending') ?? -1;
  const nextApproverName =
    letter.status === 'pending_approval' &&
    letter.approvalSteps &&
    letter.approvalSteps.length > 1 &&
    pendingIndex >= 0 &&
    pendingIndex + 1 < letter.approvalSteps.length
      ? letter.approvalSteps[pendingIndex + 1]?.approver?.name ?? '—'
      : null;

  const content = (
    <ScrollArea className="max-h-[70vh]">
      <div className="space-y-6 pr-4">
        <div className="flex flex-wrap items-center gap-2">
          <LetterTypeBadge type={letter.type} />
          <StatusBadge status={letter.status} />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Lokasi surat:</span>
          <span className="font-medium">{location.text}</span>
        </div>

        {nextApproverName != null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Approver berikutnya:</span>
            <span className="font-medium text-foreground">{nextApproverName}</span>
          </div>
        )}

        <div>
          <p className="text-xs text-muted-foreground font-mono mb-1">
            Nomor surat: {displayRef}
          </p>
          <h2 className="text-lg font-bold">{letter.subject}</h2>
        </div>

        {letter.ccDisplay && letter.ccDisplay.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Tembusan: </span>
            <span className="font-medium">{letter.ccDisplay.join(', ')}</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Akan mendapat notifikasi setelah surat disetujui oleh approver terakhir.
            </p>
          </div>
        )}

        {/* Isi Surat (read-only for creator tracking) */}
        {isProposal ? (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Isi Proposal</h3>
            {proposalFields.latarBelakang && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Latar Belakang</p>
                <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                  {proposalFields.latarBelakang}
                </div>
              </div>
            )}
            {proposalFields.tujuan && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Tujuan</p>
                <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                  {proposalFields.tujuan}
                </div>
              </div>
            )}
            {(proposalFields.anggaran || proposalFields.timeline) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {proposalFields.anggaran && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Anggaran</p>
                    <p className="font-medium">{proposalFields.anggaran}</p>
                  </div>
                )}
                {proposalFields.timeline && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Timeline</p>
                    <p className="font-medium">{proposalFields.timeline}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Isi Surat</h3>
            <div className="p-4 bg-muted rounded-lg space-y-1">
              <ContentPreview
                content={letter.content || ''}
                className="whitespace-pre-wrap"
                style={{
                  fontFamily: letter.fontFamily ?? 'Times New Roman',
                  fontSize: `${letter.fontSize ?? 12}px`,
                  lineHeight: letter.lineHeight ?? 1.5,
                  letterSpacing: letter.letterSpacing ?? 'normal',
                  textAlign: (letter.contentJustification as 'left' | 'center' | 'right' | 'justify') || 'left',
                }}
              />
            </div>
          </div>
        )}

        {/* Full approval flow — who is in charge at each step */}
        {letter.approvalSteps && letter.approvalSteps.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <FileCheck className="h-4 w-4" />
              Alur persetujuan
            </h3>
            <p className="text-xs text-muted-foreground">
              Siapa yang menangani setiap langkah — ikuti untuk tindak lanjut.
            </p>
            <div className="space-y-2">
              {letter.approvalSteps.map((step, idx) => (
                <div
                  key={step.id || idx}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
                    step.status === 'approved'
                      ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                      : step.status === 'rejected'
                        ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                        : 'bg-muted/50 border-border'
                  }`}
                >
                  <span className="font-medium text-muted-foreground w-6 shrink-0">
                    {idx + 1}.
                  </span>
                  <span className="shrink-0">
                    {step.status === 'approved' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : step.status === 'rejected' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{step.approver?.name ?? '—'}</p>
                    {step.decidedAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.status === 'approved' ? 'Disetujui' : 'Ditolak'} —{' '}
                        {format(new Date(step.decidedAt), 'd MMM yyyy HH:mm', { locale: id })}
                      </p>
                    )}
                    {step.comment && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">{step.comment}</p>
                    )}
                    {step.status === 'pending' && (
                      <p className="text-xs text-muted-foreground mt-0.5">Sedang menangani — menunggu tindakan</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${
                    step.status === 'approved' ? 'text-green-600' :
                    step.status === 'rejected' ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {step.status === 'approved' ? 'Disetujui' : step.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status history */}
        {letter.statusHistory && letter.statusHistory.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              Riwayat status
            </h3>
            <ul className="space-y-2">
              {letter.statusHistory.map((entry, idx) => (
                <li
                  key={entry.id || idx}
                  className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0 text-sm"
                >
                  <span className="font-medium">
                    {statusLabel[entry.status] ?? entry.status}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {entry.changedBy?.name ?? '—'} ·{' '}
                    {format(new Date(entry.changedAt), 'd MMM yyyy HH:mm', { locale: id })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-6 max-h-[90vh]">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle>Lacak Surat</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lacak Surat</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
