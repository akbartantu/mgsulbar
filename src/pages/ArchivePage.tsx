import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLetters } from '@/hooks/useDataWithFallback';
import { LetterList } from '@/components/mail/LetterList';
import { LacakSuratDialog } from '@/components/mail/LacakSuratDialog';
import { useAuth } from '@/contexts/AuthContext';
import type { Letter } from '@/types/mail';
import { Archive } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ArchivePage() {
  const { user } = useAuth();
  const { letters, loading } = useLetters();
  const [trackLetter, setTrackLetter] = useState<Letter | null>(null);
  const [trackOpen, setTrackOpen] = useState(false);
  const archivedLetters = letters.filter(l => l.status === 'archived' || l.status === 'sent');

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <Archive className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Arsip</h1>
          </div>
          <p className="text-muted-foreground">
            Surat yang sudah terkirim atau diarsipkan
          </p>
        </motion.div>

        <LetterList
          letters={archivedLetters}
          currentUserId={user?.id}
          onTrack={(letter) => {
            setTrackLetter(letter);
            setTrackOpen(true);
          }}
          isLoading={loading}
          emptyMessage="Belum ada surat yang diarsipkan. Tambahkan data pertama Anda."
        />

        <LacakSuratDialog
          open={trackOpen}
          onOpenChange={(open) => {
            setTrackOpen(open);
            if (!open) setTrackLetter(null);
          }}
          letter={trackLetter}
        />
      </div>
    </AppLayout>
  );
}
