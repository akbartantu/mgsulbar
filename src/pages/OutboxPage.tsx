import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LetterList } from '@/components/mail/LetterList';
import { LetterDetailDialog } from '@/components/mail/LetterDetailDialog';
import { LacakSuratDialog } from '@/components/mail/LacakSuratDialog';
import SignatureDialog from '@/components/signature/SignatureDialog';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useLetters } from '@/hooks/useDataWithFallback';
import type { Letter, Signature } from '@/types/mail';
import type { Member } from '@/lib/api';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

function isApprovedOrSent(letter: Letter): boolean {
  return letter.status === 'approved' || letter.status === 'sent';
}

function isUserSenderOrCc(letter: Letter, userId: string, members: Member[]): boolean {
  if (!userId || !members.length) return false;
  const senderMember = members.find((m) => `${m.role} – ${m.name}` === letter.from && (m.userId || '').trim() === userId);
  if (senderMember) return true;
  const userMember = members.find((m) => (m.userId || '').trim() === userId);
  if (userMember && letter.cc?.includes(userMember.id)) return true;
  return false;
}

export default function OutboxPage() {
  const { user } = useAuth();
  const { letters: allLetters, loading } = useLetters();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [letterToSign, setLetterToSign] = useState<Letter | null>(null);
  const [trackLetter, setTrackLetter] = useState<Letter | null>(null);
  const [trackOpen, setTrackOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api
      .getMembers({ periodId: 'current' })
      .then(setMembers)
      .catch(() => {
        toast({ title: 'Gagal memuat anggota', variant: 'destructive' });
        setMembers([]);
      });
  }, [toast]);

  const letters = useMemo(
    () =>
      allLetters.filter(
        (l) =>
          isApprovedOrSent(l) &&
          (user?.id ? isUserSenderOrCc(l, user.id, members) : false)
      ),
    [allLetters, user?.id, members]
  );

  const handleLetterClick = (letter: Letter) => {
    setSelectedLetter(letter);
    setDetailOpen(true);
  };

  const handleOpenSignature = (letter: Letter) => {
    setLetterToSign(letter);
    setSignatureOpen(true);
  };

  const handleSign = (letterId: string, signatureDataUrl: string) => {
    const signedBy = user ? { id: user.id, name: user.name, email: user.email, role: user.role } : { id: '', name: '', email: '', role: 'viewer' };
    const newSignature: Signature = {
      id: `sig-${Date.now()}`,
      signedBy,
      signatureDataUrl,
      signedAt: new Date().toISOString(),
    };

    setLetters(prev =>
      prev.map(letter =>
        letter.id === letterId
          ? {
              ...letter,
              signatures: [...(letter.signatures || []), newSignature],
              updatedAt: new Date().toISOString()
            }
          : letter
      )
    );

    if (selectedLetter?.id === letterId) {
      setSelectedLetter(prev =>
        prev ? {
          ...prev,
          signatures: [...(prev.signatures || []), newSignature],
          updatedAt: new Date().toISOString()
        } : null
      );
    }

    toast({
      title: 'Berhasil ditandatangani',
      description: 'Tanda tangan digital telah disimpan pada surat.',
    });
  };

  const handleSend = (letter: Letter) => {
    setLetters(prev =>
      prev.map(l =>
        l.id === letter.id
          ? { ...l, status: 'sent', sentAt: new Date().toISOString() }
          : l
      )
    );
    setDetailOpen(false);
    toast({
      title: 'Surat terkirim',
      description: 'Surat telah berhasil dikirim.',
    });
  };

  const handleLetterUpdated = (letter: Letter) => {
    setLetters((prev) => prev.map((l) => (l.id === letter.id ? letter : l)));
    setSelectedLetter(letter);
    toast({ title: 'Surat diteruskan', description: 'Penerima telah ditambahkan.' });
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
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Send className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Surat Keluar</h1>
          </div>
          <p className="text-muted-foreground">
            Lihat dan kelola surat keluar, undangan, dan nota dinas
          </p>
        </motion.div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Memuat dokumen...</p>
        ) : (
          <LetterList
            letters={letters}
            onLetterClick={handleLetterClick}
            onSign={handleOpenSignature}
            currentUserId={user?.id}
            onTrack={(letter) => {
              setTrackLetter(letter);
              setTrackOpen(true);
            }}
            emptyMessage="Belum ada surat keluar"
          />
        )}
      </div>

      <LacakSuratDialog
        open={trackOpen}
        onOpenChange={(open) => {
          setTrackOpen(open);
          if (!open) setTrackLetter(null);
        }}
        letter={trackLetter}
      />

      <LetterDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        letter={selectedLetter}
        onSign={handleOpenSignature}
        onSend={handleSend}
        onLetterUpdated={handleLetterUpdated}
      />

      <SignatureDialog
        open={signatureOpen}
        onOpenChange={setSignatureOpen}
        letter={letterToSign}
        onSign={handleSign}
      />
    </AppLayout>
  );
}
