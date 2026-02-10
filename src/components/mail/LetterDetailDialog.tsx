import React, { useState, useEffect } from 'react';
import { Letter } from '@/types/mail';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import type { Member } from '@/lib/api';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StatusBadge, PriorityBadge, LetterTypeBadge } from './StatusBadge';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Calendar, 
  User, 
  Paperclip, 
  Clock, 
  PenLine,
  FileCheck,
  CheckCircle2,
  Send,
  FileDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStatsRefetch } from '@/contexts/DashboardStatsContext';
import { generateLetterPdf } from '@/lib/generateLetterPdf';
import { MapPin, Pencil, Check, RotateCcw, X, Forward } from 'lucide-react';
import { ContentPreview } from '@/components/mail/ContentPreview';
import { Checkbox } from '@/components/ui/checkbox';
import {
  formatEventDetailsHtml,
  hasEventDetailsPlaceholder,
  EVENT_DETAILS_PLACEHOLDER,
} from '@/lib/eventDetails';

interface LetterDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letter: Letter | null;
  onSign?: (letter: Letter) => void;
  onSend?: (letter: Letter) => void;
  onEdit?: (letter: Letter) => void;
  onApprove?: (letter: Letter, comment?: string) => void;
  onReturn?: (letter: Letter, comment?: string) => void;
  onCancel?: (letter: Letter, comment?: string) => void;
  onForward?: (letter: Letter) => void;
  onLetterUpdated?: (letter: Letter) => void;
}

function getLetterLocation(letter: Letter): { text: string; outcome?: 'approved' | 'returned' | 'cancelled' } {
  if (letter.status === 'draft') return { text: 'Draft' };
  if (letter.status === 'approved' || letter.status === 'sent') return { text: 'Disetujui', outcome: 'approved' };
  if (letter.status === 'revision') return { text: 'Dikembalikan', outcome: 'returned' };
  if (letter.status === 'rejected') return { text: 'Ditolak / Dibatalkan', outcome: 'cancelled' };
  if (letter.status === 'pending_approval' && letter.approvalSteps?.length) {
    const pending = letter.approvalSteps.find((s) => s.status === 'pending');
    if (pending?.approver) {
      return { text: `Menunggu Persetujuan dari ${pending.approver.name}` };
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

export function LetterDetailDialog({ 
  open, 
  onOpenChange, 
  letter,
  onSign,
  onSend,
  onEdit,
  onApprove,
  onReturn,
  onCancel,
  onForward,
  onLetterUpdated,
}: LetterDetailDialogProps) {
  const isMobile = useIsMobile();
  const { user: currentUser } = useAuth();
  const refetchDashboardStats = useDashboardStatsRefetch();
  const [approvalComment, setApprovalComment] = useState('');
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardMembers, setForwardMembers] = useState<Member[]>([]);
  const [forwardSelectedIds, setForwardSelectedIds] = useState<string[]>([]);
  const [forwardSubmitting, setForwardSubmitting] = useState(false);

  useEffect(() => {
    if (forwardOpen) {
      api.getMembers({ periodId: 'current' }).then(setForwardMembers).catch(() => setForwardMembers([]));
      setForwardSelectedIds([]);
    }
  }, [forwardOpen]);

  useEffect(() => {
    if (!open || !letter?.id) return;
    const log = (msg: string, data: Record<string, unknown>) => fetch('http://127.0.0.1:7246/ingest/55bae2bf-7bcd-493f-9377-31aad3707983',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LetterDetailDialog.tsx:markRead',message:msg,data,timestamp:Date.now()})}).catch(()=>{});
    log('markRead effect run', { letterId: letter.id, hasRefetch: !!refetchDashboardStats });
    api.markLetterAsRead(letter.id)
      .then(() => {
        log('markLetterAsRead success', { letterId: letter.id });
        refetchDashboardStats?.();
      })
      .catch((e) => log('markLetterAsRead error', { letterId: letter.id, err: e?.message }));
  }, [open, letter?.id, refetchDashboardStats]);

  if (!letter) return null;

  const isProposal = letter.type === 'proposal';
  let proposalFields: { latarBelakang?: string; tujuan?: string; anggaran?: string; timeline?: string } = {};
  if (isProposal && letter.content) {
    try {
      proposalFields = JSON.parse(letter.content);
    } catch {
      proposalFields = {};
    }
  }

  const location = getLetterLocation(letter);
  const pendingStep = letter.approvalSteps?.find((s) => s.status === 'pending');
  const isCurrentApprover = currentUser && pendingStep?.approver?.id === currentUser.id;
  const isCreator = currentUser && letter.createdBy?.id === currentUser.id;

  const canSign = currentUser && letter.status === 'approved' && 
    !letter.signatures?.some(s => s.signedBy.id === currentUser.id);
  
  const isSigned = letter.signatures && letter.signatures.length > 0;
  const canSend = letter.status === 'approved' && isSigned;
  const canPrint = letter.status === 'approved' || letter.status === 'sent';
  const canEditDraft = letter.status === 'draft' && onEdit;
  const canEditAsApprover = letter.status === 'pending_approval' && isCurrentApprover && onEdit;
  /** Creator can edit only when draft or when returned for revision */
  const canEditAsCreator = letter.status === 'revision' && isCreator && onEdit;
  /** Submitted surat can be forwarded to other member/user */
  const canForward = (letter.status === 'pending_approval' || letter.status === 'approved' || letter.status === 'sent') && (onForward || onLetterUpdated);

  const handlePrintPdf = async () => {
    await generateLetterPdf(letter);
  };

  const content = (
    <ScrollArea className="max-h-[70vh]">
      <div className="space-y-6 pr-4">
        {/* Status & Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <LetterTypeBadge type={letter.type} />
          <StatusBadge status={letter.status} />
          {letter.priority !== 'normal' && (
            <PriorityBadge priority={letter.priority} />
          )}
        </div>

        {/* Lokasi surat / Where is the surat */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Lokasi surat:</span>
          <span className="font-medium">{location.text}</span>
        </div>

        {/* Nomor surat & Subject */}
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-1">
            Nomor surat: {getDisplayReferenceNumber(letter)}
          </p>
          <h2 className="text-xl font-bold">{letter.subject}</h2>
        </div>

        {letter.ccDisplay && letter.ccDisplay.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Tembusan: </span>
            <span className="font-medium">{letter.ccDisplay.join(', ')}</span>
          </div>
        )}

        {letter.forwardedTo && letter.forwardedTo.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Diteruskan ke: </span>
            <span className="font-medium">{letter.forwardedTo.map((u) => u.name).join(', ')}</span>
          </div>
        )}

        <Separator />

        {/* Meta Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              Dari
            </p>
            <p className="font-medium">{letter.from}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              Kepada
            </p>
            <p className="font-medium">{letter.to}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Tanggal Dibuat
            </p>
            <p className="font-medium">
              {format(new Date(letter.createdAt), 'd MMMM yyyy', { locale: id })}
            </p>
          </div>
          {letter.dueDate && (
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Batas Waktu
              </p>
              <p className="font-medium">
                {format(new Date(letter.dueDate), 'd MMMM yyyy', { locale: id })}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Kop surat (letterhead) for approved/sent letters */}
        {(letter.status === 'approved' || letter.status === 'sent') && (
          <div className="mb-4">
            <img
              src={encodeURI('/Kop Surat MGSulbar.png')}
              alt="Kop Surat Mata Garuda Sulawesi Barat"
              className="w-full max-w-full h-auto object-contain"
            />
          </div>
        )}

        {/* Content */}
        {isProposal ? (
          <div className="space-y-4">
            <h3 className="font-semibold">Isi Proposal</h3>
            {proposalFields.latarBelakang && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Latar Belakang</p>
                <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                  {proposalFields.latarBelakang}
                </div>
              </div>
            )}
            {proposalFields.tujuan && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tujuan</p>
                <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                  {proposalFields.tujuan}
                </div>
              </div>
            )}
            {(proposalFields.anggaran || proposalFields.timeline) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {proposalFields.anggaran && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Anggaran</p>
                    <p className="text-sm font-medium">{proposalFields.anggaran}</p>
                  </div>
                )}
                {proposalFields.timeline && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Timeline</p>
                    <p className="text-sm font-medium">{proposalFields.timeline}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="font-semibold">Isi Surat</h3>
            <div className="p-4 bg-muted rounded-lg space-y-1">
              <ContentPreview
                content={
                  hasEventDetailsPlaceholder(letter.content || '')
                    ? (letter.content || '').replace(EVENT_DETAILS_PLACEHOLDER, formatEventDetailsHtml(letter))
                    : letter.content || ''
                }
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

        {/* Attachments */}
        {letter.attachments.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Lampiran ({letter.attachments.length})
            </h3>
            <div className="space-y-2">
              {letter.attachments.map((att, attIdx) => (
                <div 
                  key={att.id ?? `att-${attIdx}`} 
                  className="flex items-center gap-2 p-2 bg-muted rounded text-sm"
                >
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{att.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {(att.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signatures */}
        {letter.signatures && letter.signatures.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              Tanda Tangan
            </h3>
            <div className="grid gap-3">
              {letter.signatures.map((sig, sigIdx) => (
                <div 
                  key={sig.id ?? `sig-${sigIdx}`} 
                  className="p-3 border rounded-lg bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm">{sig.signedBy?.name ?? '—'}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {sig.signedAt ? format(new Date(sig.signedAt), 'd MMM yyyy HH:mm', { locale: id }) : '—'}
                    </span>
                  </div>
                  <img 
                    src={sig.signatureDataUrl} 
                    alt={`Tanda tangan ${sig.signedBy?.name ?? '—'}`}
                    className="max-h-16 bg-white rounded border"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(canEditDraft || canEditAsApprover || canEditAsCreator || canSign || canSend || canPrint || canForward || (isCurrentApprover && (onApprove || onReturn || onCancel))) && (
          <>
            <Separator />
            {isCurrentApprover && (onApprove || onReturn || onCancel) && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Catatan (opsional)</label>
                <textarea
                  className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Tambahkan catatan untuk disetujui/dikembalikan/dibatalkan..."
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                />
              </div>
            )}
            <div className="flex gap-2 justify-end flex-wrap">
              {(canEditDraft || canEditAsApprover || canEditAsCreator) && (
                <Button onClick={() => onEdit?.(letter)} variant="outline" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              )}
              {isCurrentApprover && onApprove && (
                <Button onClick={() => onApprove(letter, approvalComment)} className="gap-2">
                  <Check className="h-4 w-4" />
                  Setujui
                </Button>
              )}
              {isCurrentApprover && onReturn && (
                <Button onClick={() => onReturn(letter, approvalComment)} variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Kembalikan
                </Button>
              )}
              {isCurrentApprover && onCancel && (
                <Button onClick={() => onCancel(letter, approvalComment)} variant="destructive" className="gap-2">
                  <X className="h-4 w-4" />
                  Batalkan
                </Button>
              )}
              {canPrint && (
                <Button onClick={handlePrintPdf} variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Cetak PDF
                </Button>
              )}
              {canSign && (
                <Button onClick={() => onSign?.(letter)} className="gap-2">
                  <PenLine className="h-4 w-4" />
                  Tanda Tangani
                </Button>
              )}
              {canSend && (
                <Button onClick={() => onSend?.(letter)} variant="success" className="gap-2">
                  <Send className="h-4 w-4" />
                  Kirim Surat
                </Button>
              )}
              {canForward && (
                <Button onClick={() => setForwardOpen(true)} variant="outline" className="gap-2">
                  <Forward className="h-4 w-4" />
                  Teruskan
                </Button>
              )}
            </div>
          </>
        )}

        {/* Approval Timeline */}
        {letter.approvalSteps.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Riwayat Persetujuan
            </h3>
            <div className="space-y-2">
              {letter.approvalSteps.map((step, idx) => (
                <div 
                  key={step.id ?? `step-${idx}`} 
                  className={`flex flex-col gap-1 p-2 rounded text-sm ${
                    step.status === 'approved' ? 'bg-green-50 border-green-200' :
                    step.status === 'rejected' ? 'bg-red-50 border-red-200' :
                    'bg-muted'
                  } border`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-muted-foreground w-6">
                      #{idx + 1}
                    </span>
                    <span className="flex-1">{step.approver?.name ?? '—'}</span>
                    <span className={`text-xs font-medium shrink-0 ${
                      step.status === 'approved' ? 'text-green-600' :
                      step.status === 'rejected' ? 'text-red-600' : 'text-muted-foreground'
                    }`}>
                      {step.status === 'approved' ? 'Disetujui' : step.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                    </span>
                  </div>
                  {step.comment && (
                    <p className="text-xs text-muted-foreground pl-9 pr-2">{step.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  const existingForwardIds = (letter.forwardedTo || []).map((u) => u.id);
  const availableMembers = forwardMembers.filter((m) => !existingForwardIds.includes(m.id));

  const handleForwardConfirm = async () => {
    if (forwardSelectedIds.length === 0 || !letter) return;
    setForwardSubmitting(true);
    try {
      const selectedUsers = forwardSelectedIds
        .map((id) => {
          const m = forwardMembers.find((x) => x.id === id);
          return m ? { id: m.id, name: m.name, email: m.email || '' } : null;
        })
        .filter(Boolean) as { id: string; name: string; email: string }[];
      const newForwardedTo = [...(letter.forwardedTo || []), ...selectedUsers];
      const updated = await api.updateLetter(letter.id, { forwardedTo: newForwardedTo });
      onLetterUpdated?.(updated);
      onForward?.(updated);
      setForwardOpen(false);
      setForwardSelectedIds([]);
    } finally {
      setForwardSubmitting(false);
    }
  };

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="px-4 pb-6 max-h-[90vh]">
            <DrawerHeader className="text-left px-0">
              <DrawerTitle>Detail Surat</DrawerTitle>
            </DrawerHeader>
            {content}
          </DrawerContent>
        </Drawer>
        <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Teruskan surat</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Pilih anggota yang akan menerima surat ini.</p>
            <ScrollArea className="max-h-[240px] rounded border p-2">
              <div className="space-y-2">
                {availableMembers.map((m, idx) => (
                  <label key={m.id ?? `member-${idx}`} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={forwardSelectedIds.includes(m.id)}
                      onCheckedChange={(checked) =>
                        setForwardSelectedIds((prev) =>
                          checked ? [...prev, m.id] : prev.filter((id) => id !== m.id)
                        )
                      }
                    />
                    <span>{m.role} – {m.name}</span>
                  </label>
                ))}
                {availableMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground">Semua anggota periode saat ini sudah ditambahkan.</p>
                )}
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setForwardOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleForwardConfirm} disabled={forwardSelectedIds.length === 0 || forwardSubmitting}>
                {forwardSubmitting ? 'Menambahkan...' : 'Teruskan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detail Surat</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
      <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Teruskan surat</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Pilih anggota yang akan menerima surat ini.</p>
          <ScrollArea className="max-h-[240px] rounded border p-2">
            <div className="space-y-2">
              {availableMembers.map((m, idx) => (
                <label key={m.id ?? `member-${idx}`} className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={forwardSelectedIds.includes(m.id)}
                    onCheckedChange={(checked) =>
                      setForwardSelectedIds((prev) =>
                        checked ? [...prev, m.id] : prev.filter((id) => id !== m.id)
                      )
                    }
                  />
                  <span>{m.role} – {m.name}</span>
                </label>
              ))}
              {availableMembers.length === 0 && (
                <p className="text-sm text-muted-foreground">Semua anggota periode saat ini sudah ditambahkan.</p>
              )}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setForwardOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleForwardConfirm} disabled={forwardSelectedIds.length === 0 || forwardSubmitting}>
              {forwardSubmitting ? 'Menambahkan...' : 'Teruskan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
