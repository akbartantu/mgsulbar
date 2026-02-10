import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LetterList } from '@/components/mail/LetterList';
import { LetterDetailDialog } from '@/components/mail/LetterDetailDialog';
import { useLetters } from '@/hooks/useDataWithFallback';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStatsRefetch } from '@/contexts/DashboardStatsContext';
import { api } from '@/lib/api';
import type { Letter, ApprovalStep } from '@/types/mail';
import { ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

function isPendingForUser(letter: Letter, userId: string): boolean {
  if (letter.status !== 'pending_approval' || !letter.approvalSteps?.length) return false;
  const pending = letter.approvalSteps.find((s) => s.status === 'pending');
  return pending?.approver?.id === userId;
}

export default function ApprovalsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const refetchStats = useDashboardStatsRefetch();
  const { letters: allLetters, loading, refetch } = useLetters();
  const letters = useMemo(
    () =>
      user?.id
        ? allLetters.filter((l) => l.status === 'pending_approval' && isPendingForUser(l, user.id))
        : allLetters.filter((l) => l.status === 'pending_approval'),
    [allLetters, user?.id]
  );
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleLetterClick = (letter: Letter) => {
    setSelectedLetter(letter);
    setDetailOpen(true);
    api.markLetterAsRead(letter.id).then(() => refetchStats?.()).catch(() => {});
  };

  const handleEdit = (letter: Letter) => {
    setDetailOpen(false);
    navigate(`/create/${letter.id}`);
  };

  const applyApprovalDecision = (
    letter: Letter,
    stepStatus: 'approved' | 'rejected',
    newLetterStatus: 'approved' | 'revision' | 'rejected',
    comment?: string
  ) => {
    const now = new Date().toISOString();
    const pendingIndex = letter.approvalSteps.findIndex((s) => s.status === 'pending');
    if (pendingIndex === -1) return;

    // Mark current step as approved/rejected; persist comment (approve/return with notes)
    let updatedSteps: ApprovalStep[] = letter.approvalSteps.map((s, i) =>
      i === pendingIndex
        ? { ...s, status: stepStatus, decidedAt: now, comment: comment?.trim() || s.comment }
        : s
    );

    // When approved, advance to next approver: set next step to 'pending'
    if (stepStatus === 'approved' && pendingIndex + 1 < letter.approvalSteps.length) {
      const nextStep = letter.approvalSteps[pendingIndex + 1];
      updatedSteps = updatedSteps.map((s, i) =>
        i === pendingIndex + 1 ? { ...nextStep, status: 'pending' as const } : s
      );
    }

    const isLastStep = pendingIndex === letter.approvalSteps.length - 1;
    const allApproved = stepStatus === 'approved' && isLastStep;
    const status = newLetterStatus === 'revision' || newLetterStatus === 'rejected'
      ? newLetterStatus
      : allApproved
        ? 'approved'
        : 'pending_approval';

    const statusHistory = [
      ...(letter.statusHistory || []),
      {
        id: `sh-${Date.now()}`,
        status,
        changedBy: user!,
        changedAt: now,
      },
    ];

    return api.updateLetter(letter.id, {
      approvalSteps: updatedSteps,
      status,
      statusHistory,
    });
  };

  const handleApprove = async (letter: Letter, comment?: string) => {
    try {
      await applyApprovalDecision(letter, 'approved', 'approved', comment);
      toast({ title: 'Surat disetujui' });
      setDetailOpen(false);
      setSelectedLetter(null);
      refetch();
    } catch {
      toast({ title: 'Gagal menyetujui', variant: 'destructive' });
    }
  };

  const handleReturn = async (letter: Letter, comment?: string) => {
    try {
      await applyApprovalDecision(letter, 'rejected', 'revision', comment);
      toast({ title: 'Surat dikembalikan untuk revisi' });
      setDetailOpen(false);
      setSelectedLetter(null);
      refetch();
    } catch {
      toast({ title: 'Gagal mengembalikan', variant: 'destructive' });
    }
  };

  const handleCancel = async (letter: Letter, comment?: string) => {
    try {
      await applyApprovalDecision(letter, 'rejected', 'rejected', comment);
      toast({ title: 'Surat dibatalkan' });
      setDetailOpen(false);
      setSelectedLetter(null);
      refetch();
    } catch {
      toast({ title: 'Gagal membatalkan', variant: 'destructive' });
    }
  };

  const handleDetailClose = (open: boolean) => {
    setDetailOpen(open);
    if (!open) setSelectedLetter(null);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Persetujuan</h1>
          </div>
          <p className="text-muted-foreground">
            Surat yang menunggu persetujuan Anda
          </p>
        </motion.div>

        <LetterList
          letters={letters}
          onLetterClick={handleLetterClick}
          isLoading={loading}
          emptyMessage="Belum ada surat menunggu persetujuan."
        />

        <LetterDetailDialog
          open={detailOpen}
          onOpenChange={handleDetailClose}
          letter={selectedLetter}
          onEdit={handleEdit}
          onApprove={handleApprove}
          onReturn={handleReturn}
          onCancel={handleCancel}
        />
      </div>
    </AppLayout>
  );
}
