import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import SignaturePad from './SignaturePad';
import { Letter } from '@/types/mail';
import { PenLine, FileCheck } from 'lucide-react';

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letter: Letter | null;
  onSign: (letterId: string, signatureDataUrl: string) => void;
}

const SignatureDialog: React.FC<SignatureDialogProps> = ({
  open,
  onOpenChange,
  letter,
  onSign,
}) => {
  const isMobile = useIsMobile();
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const handleSave = (signatureDataUrl: string) => {
    if (!letter) return;
    setSignaturePreview(signatureDataUrl);
    onSign(letter.id, signatureDataUrl);
    onOpenChange(false);
    setSignaturePreview(null);
  };

  const handleClear = () => {
    setSignaturePreview(null);
  };

  const content = (
    <div className="space-y-4">
      {letter && (
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileCheck className="h-4 w-4 text-primary" />
            <span>Dokumen yang akan ditandatangani:</span>
          </div>
          <div className="text-sm">
            <p className="font-semibold">{letter.subject}</p>
            <p className="text-muted-foreground">No: {letter.referenceNumber}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <PenLine className="h-4 w-4 text-primary" />
          <span>Buat tanda tangan Anda:</span>
        </div>
        <SignaturePad
          onSave={handleSave}
          onClear={handleClear}
          width={500}
          height={200}
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Gunakan mouse atau sentuh layar untuk menandatangani. Tanda tangan akan disimpan dan dilampirkan pada dokumen.
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5" />
              Tanda Tangan Digital
            </DrawerTitle>
            <DrawerDescription>
              Tanda tangani dokumen yang telah disetujui
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5" />
            Tanda Tangan Digital
          </DialogTitle>
          <DialogDescription>
            Tanda tangani dokumen yang telah disetujui
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default SignatureDialog;
