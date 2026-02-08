import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LetterList } from '@/components/mail/LetterList';
import { LetterDetailDialog } from '@/components/mail/LetterDetailDialog';
import { LacakSuratDialog } from '@/components/mail/LacakSuratDialog';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Letter } from '@/types/mail';
import { FileEdit } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export default function DraftsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [trackLetter, setTrackLetter] = useState<Letter | null>(null);
  const [trackOpen, setTrackOpen] = useState(false);

  useEffect(() => {
    api
      .getLetters()
      .then((list) => setLetters(list.filter((l) => l.status === 'draft')))
      .catch(() => {
        toast({ title: 'Gagal memuat draft', variant: 'destructive' });
        setLetters([]);
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const handleLetterClick = (letter: Letter) => {
    setSelectedLetter(letter);
    setDetailOpen(true);
  };

  const handleEdit = (letter: Letter) => {
    setDetailOpen(false);
    navigate(`/create/${letter.id}`);
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
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <FileEdit className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Draft</h1>
          </div>
          <p className="text-muted-foreground">
            Surat yang belum selesai atau menunggu pengiriman
          </p>
        </motion.div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Memuat draft...</p>
        ) : (
          <LetterList
            letters={letters}
            onLetterClick={handleLetterClick}
            currentUserId={user?.id}
            onTrack={(letter) => {
              setTrackLetter(letter);
              setTrackOpen(true);
            }}
            emptyMessage="Tidak ada draft tersimpan"
          />
        )}

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
          onOpenChange={handleDetailClose}
          letter={selectedLetter}
          onEdit={handleEdit}
        />
      </div>
    </AppLayout>
  );
}
