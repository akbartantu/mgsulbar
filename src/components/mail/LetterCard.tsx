import { Letter } from '@/types/mail';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, PriorityBadge, LetterTypeBadge } from './StatusBadge';
import { Paperclip, Calendar, User, PenLine, CheckCircle2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'framer-motion';

/** Nomor surat: only show actual number after final approval; otherwise placeholder */
function getDisplayReferenceNumber(letter: Letter): string {
  if (letter.status === 'approved' || letter.status === 'sent') {
    return letter.referenceNumber?.trim() || '—';
  }
  return 'Akan diberikan setelah disetujui';
}

interface LetterCardProps {
  letter: Letter;
  onClick?: () => void;
  onSign?: (letter: Letter) => void;
  onTrack?: (letter: Letter) => void;
  index?: number;
}

export function LetterCard({ letter, onClick, onSign, onTrack, index = 0 }: LetterCardProps) {
  const canSign = letter.status === 'approved' && (!letter.signatures || letter.signatures.length === 0);
  const isSigned = letter.signatures && letter.signatures.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card 
        className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 group"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Header with badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <LetterTypeBadge type={letter.type} />
                <StatusBadge status={letter.status} />
                {letter.priority !== 'normal' && (
                  <PriorityBadge priority={letter.priority} />
                )}
                {isSigned && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" />
                    Ditandatangani
                  </span>
                )}
              </div>
              
              {/* Nomor surat (diberikan setelah disetujui) */}
              <p className="text-xs text-muted-foreground font-mono mb-1">
                Nomor: {getDisplayReferenceNumber(letter)}
              </p>
              
              {/* Subject */}
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-2">
                {letter.subject}
              </h3>
              
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {letter.to}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(letter.createdAt), 'd MMM yyyy', { locale: id })}
                </span>
                {letter.attachments.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5" />
                    {letter.attachments.length}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {onTrack && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTrack(letter);
                  }}
                >
                  <MapPin className="h-4 w-4" />
                  Lacak
                </Button>
              )}
              {canSign && onSign && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSign(letter);
                  }}
                >
                  <PenLine className="h-4 w-4" />
                  Tanda Tangan
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
