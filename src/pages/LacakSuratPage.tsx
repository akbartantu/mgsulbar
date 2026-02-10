import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LetterList } from '@/components/mail/LetterList';
import { LacakSuratDialog } from '@/components/mail/LacakSuratDialog';
import { useLetters } from '@/hooks/useDataWithFallback';
import { useAuth } from '@/contexts/AuthContext';
import type { Letter } from '@/types/mail';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LacakSuratPage() {
  const { user } = useAuth();
  const { letters: allLetters, loading } = useLetters();
  const letters = useMemo(
    () => (user?.id ? allLetters.filter((l) => l.createdBy?.id === user.id) : []),
    [allLetters, user?.id]
  );
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [trackOpen, setTrackOpen] = useState(false);

  const handleLetterClick = (letter: Letter) => {
    setSelectedLetter(letter);
    setTrackOpen(true);
  };

  const handleTrackClose = (open: boolean) => {
    setTrackOpen(open);
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
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <MapPin className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Lacak Surat</h1>
          </div>
          <p className="text-muted-foreground">
            Surat yang Anda buat — lihat lokasi dan alur persetujuan
          </p>
        </motion.div>

        <LetterList
          letters={letters}
          onLetterClick={handleLetterClick}
          isLoading={loading}
          emptyMessage="Belum ada surat yang Anda buat. Tambahkan data pertama Anda."
        />

        <LacakSuratDialog
          open={trackOpen}
          onOpenChange={handleTrackClose}
          letter={selectedLetter}
        />
      </div>
    </AppLayout>
  );
}
