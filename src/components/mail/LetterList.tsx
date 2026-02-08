import { useState } from 'react';
import { Letter } from '@/types/mail';
import { LetterCard } from './LetterCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';

interface LetterListProps {
  letters: Letter[];
  onLetterClick?: (letter: Letter) => void;
  onSign?: (letter: Letter) => void;
  /** When set, show "Lacak Surat" on cards for letters created by this user */
  currentUserId?: string | null;
  onTrack?: (letter: Letter) => void;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function LetterList({ letters, onLetterClick, onSign, currentUserId, onTrack, emptyMessage = 'Tidak ada surat', isLoading }: LetterListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Memuat...
        </div>
      </div>
    );
  }

  const filteredLetters = letters
    .filter(letter => 
      letter.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      letter.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      letter.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      letter.to.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari surat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          title={sortOrder === 'desc' ? 'Terbaru dulu' : 'Terlama dulu'}
        >
          {sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Letter Count */}
      <p className="text-sm text-muted-foreground">
        Menampilkan {filteredLetters.length} dari {letters.length} surat
      </p>

      {/* Letter Cards */}
      <div className="space-y-3">
        {filteredLetters.length > 0 ? (
          filteredLetters.map((letter, index) => (
            <LetterCard
              key={letter.id}
              letter={letter}
              onClick={() => onLetterClick?.(letter)}
              onSign={onSign}
              onTrack={letter.createdBy?.id === currentUserId ? onTrack : undefined}
              index={index}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
