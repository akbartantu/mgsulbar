import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ListOrdered,
  IndentIncrease,
  IndentDecrease,
  Bold,
  Italic,
  Underline,
  ChevronDown,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface RichTextToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onBullet: () => void;
  onNumbered: () => void;
  onAlpha: () => void;
  onRoman: () => void;
  onClearList: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  /** Rendered at the start of the toolbar (e.g. alignment/spacing controls) */
  prefix?: React.ReactNode;
}

/** Four list types only: decimal, lower-alpha, lower-roman, disc (bullet). */
const NUMBERING_OPTIONS = [
  { id: 'none', label: 'None', preview: '  ', actionKey: 'none' },
  { id: '1.', label: '1. 2. 3.', preview: '1.\n2.\n3.', actionKey: 'numbered' },
  { id: 'a.', label: 'a. b. c.', preview: 'a.\nb.\nc.', actionKey: 'alpha' },
  { id: 'i.', label: 'i. ii. iii.', preview: 'i.\nii.\niii.', actionKey: 'roman' },
  { id: 'bullet', label: 'Bullet', preview: '•\n•\n•', actionKey: 'bullet' },
] as const;

export function RichTextToolbar({
  onBold,
  onItalic,
  onUnderline,
  onBullet,
  onNumbered,
  onAlpha,
  onRoman,
  onClearList,
  onIndent,
  onOutdent,
  prefix,
}: RichTextToolbarProps) {
  const [numberingOpen, setNumberingOpen] = useState(false);

  const handleNumberingSelect = (actionKey: string) => {
    setNumberingOpen(false);
    // Defer so popover closes first and editor can receive focus before list command runs
    setTimeout(() => {
      if (actionKey === 'none') {
        if (typeof onClearList === 'function') onClearList();
      } else if (actionKey === 'bullet') onBullet();
      else if (actionKey === 'numbered') onNumbered();
      else if (actionKey === 'alpha') onAlpha();
      else if (actionKey === 'roman') onRoman();
    }, 0);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5 p-1 border border-b-0 rounded-t-md bg-muted/50 flex-wrap">
        {prefix && (
          <>
            {prefix}
            <Separator orientation="vertical" className="h-5 mx-1" />
          </>
        )}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="iconSm" onClick={onBold} className="h-7 w-7">
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Bold (Ctrl+B)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="iconSm" onClick={onItalic} className="h-7 w-7">
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Italic (Ctrl+I)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="iconSm" onClick={onUnderline} className="h-7 w-7">
                <Underline className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Underline (Ctrl+U)</TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="h-5 mx-1" />
        <Popover open={numberingOpen} onOpenChange={setNumberingOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 gap-0.5 px-1.5" title="Daftar / penomoran">
              <ListOrdered className="h-4 w-4" />
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <div className="p-2 border-b">
              <p className="text-xs font-medium text-muted-foreground">Numbering Library</p>
            </div>
            <div className="p-2">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center mb-2 text-sm"
                onClick={() => handleNumberingSelect('none')}
              >
                None
              </Button>
              <div className="grid grid-cols-3 gap-1">
                {NUMBERING_OPTIONS.filter((o) => o.actionKey !== 'none').map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={cn(
                      'flex flex-col items-center justify-center p-2 rounded border text-left min-h-[52px]',
                      'hover:bg-muted text-xs'
                    )}
                    onClick={() => handleNumberingSelect(opt.actionKey)}
                  >
                    <span className="font-medium text-muted-foreground w-full">{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-pre-line leading-tight">
                      {opt.preview}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Separator orientation="vertical" className="h-5 mx-1" />
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="iconSm" onClick={onIndent} className="h-7 w-7">
                <IndentIncrease className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Indent (Tab)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="iconSm" onClick={onOutdent} className="h-7 w-7">
                <IndentDecrease className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Outdent (Shift+Tab)</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
