import { jsPDF } from 'jspdf';
import { Letter } from '@/types/mail';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { isListLine, getListLineParts } from '@/hooks/useRichTextarea';
import { sanitizeHtml, isHtmlContent } from '@/lib/sanitizeHtml';
import {
  hasEventDetailsPlaceholder,
  hasEventDetailsValues,
  EVENT_DETAILS_PLACEHOLDER,
  formatEventDetailsAsText,
} from '@/lib/eventDetails';

interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  /** Left indent in mm (e.g. blockquote). */
  indent?: number;
}

type ListContext = { parentTag: 'ol'; olCounter: number } | { parentTag: 'ul' };

const BLOCKQUOTE_INDENT_MM = 10;

/** Parse sanitized HTML into segments for PDF (text + format). Block elements and br produce newlines. Lists emit "1. ", "2. " for ol and "• " for ul before each li. Blockquote content gets indent. */
function htmlToSegments(html: string): TextSegment[] {
  const safe = sanitizeHtml(html);
  const doc = new DOMParser().parseFromString(safe, 'text/html');
  const segments: TextSegment[] = [];
  let needNewline = false;

  function pushNewline(indent?: number) {
    const seg: TextSegment = { text: '\n' };
    if (indent != null) seg.indent = indent;
    if (segments.length > 0 && segments[segments.length - 1].text !== '\n') {
      segments.push(seg);
    } else if (segments.length === 0) {
      segments.push(seg);
    } else {
      const last = segments[segments.length - 1];
      if (last.text.endsWith('\n')) return;
      segments.push(seg);
    }
  }

  function walk(
    node: Node,
    bold: boolean,
    italic: boolean,
    underline: boolean,
    listContext: ListContext | undefined,
    blockquoteIndent: number | undefined
  ) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').replace(/\u00A0/g, ' ');
      if (needNewline) {
        pushNewline(blockquoteIndent);
        needNewline = false;
      }
      if (text) {
        const seg: TextSegment = { text, bold, italic, underline };
        if (blockquoteIndent != null) seg.indent = blockquoteIndent;
        segments.push(seg);
      }
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const isBlock = /^(p|div|li|ul|ol|blockquote)$/.test(tag);
    if (isBlock && segments.length > 0) {
      pushNewline(blockquoteIndent);
      needNewline = false;
    }
    if (tag === 'br') {
      const seg: TextSegment = { text: '\n' };
      if (blockquoteIndent != null) seg.indent = blockquoteIndent;
      segments.push(seg);
      return;
    }
    if (tag === 'li') {
      if (listContext?.parentTag === 'ol') {
        segments.push({ text: `${listContext.olCounter + 1}. ` });
        listContext.olCounter += 1;
      } else if (listContext?.parentTag === 'ul') {
        segments.push({ text: '• ' });
      }
      const nextBold = bold || tag === 'strong' || tag === 'b';
      const nextItalic = italic || tag === 'em' || tag === 'i';
      const nextUnderline = underline || tag === 'u' || (tag === 'span' && el.getAttribute('style')?.includes('underline'));
      for (let i = 0; i < el.childNodes.length; i++) {
        walk(el.childNodes[i], nextBold, nextItalic, nextUnderline, undefined, blockquoteIndent);
      }
      if (isBlock) needNewline = true;
      return;
    }
    const nextBlockquoteIndent = tag === 'blockquote' ? BLOCKQUOTE_INDENT_MM : blockquoteIndent;
    const nextListContext =
      tag === 'ol' ? { parentTag: 'ol' as const, olCounter: 0 } : tag === 'ul' ? { parentTag: 'ul' as const } : listContext;
    const nextBold = bold || tag === 'strong' || tag === 'b';
    const nextItalic = italic || tag === 'em' || tag === 'i';
    const nextUnderline = underline || tag === 'u' || (tag === 'span' && el.getAttribute('style')?.includes('underline'));
    for (let i = 0; i < el.childNodes.length; i++) {
      walk(el.childNodes[i], nextBold, nextItalic, nextUnderline, nextListContext, nextBlockquoteIndent);
    }
    if (isBlock) needNewline = true;
  }

  walk(doc.body, false, false, false, undefined, undefined);
  return segments;
}

/** Kop surat (letterhead) image — official letterhead for approved/sent letters. File: public/Kop Surat MGSulbar.png */
const KOP_SURAT_IMAGE_URL = '/Kop Surat MGSulbar.png';
/** Optional logo for fallback kop (left block). Place at public/logo-mgsulbar.png. */
const LOGO_MGSULBAR_URL = '/logo-mgsulbar.png';

/** Kop text config — update to match docs/Kop Surat MGSULBAR.docx exactly. */
const KOP_TEXT = {
  kopOrgName: 'IKATAN AWARDEE BEASISWA',
  kopSubtitle: 'MGSULBAR',
  kopAddress: 'Alamat sesuai template Kop Surat MGSULBAR.docx',
  kopContact: 'Telp: … | Email: …',
};

const LETTER_TYPE_LABELS: Record<string, string> = {
  surat_keluar: 'Surat Keluar',
  surat_keputusan: 'Surat Keputusan',
  proposal: 'Proposal',
};

function loadImageAsDataUrl(url: string): Promise<string> {
  return loadImageWithDimensions(url).then((r) => r.dataUrl);
}

/** Load image and return dataUrl + dimensions for aspect-ratio sizing in PDF. */
function loadImageWithDimensions(url: string): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      } catch {
        reject(new Error('toDataURL failed'));
      }
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url.startsWith('http') ? url : `${window.location.origin}${encodeURI(url)}`;
  });
}

/** Draw a single line justified within width (jsPDF align: 'justify' with maxWidth does not work reliably). */
function drawJustifiedLine(doc: jsPDF, line: string, x: number, y: number, width: number): void {
  const words = line.trim().split(/\s+/);
  if (words.length === 0) return;
  if (words.length === 1) {
    doc.text(words[0], x, y);
    return;
  }
  const totalWordWidth = words.reduce((sum, w) => sum + doc.getTextWidth(w), 0);
  const totalSpaceWidth = width - totalWordWidth;
  const spaceBetween = totalSpaceWidth / (words.length - 1);
  let currentX = x;
  for (let i = 0; i < words.length; i++) {
    doc.text(words[i], currentX, y);
    currentX += doc.getTextWidth(words[i]) + (i < words.length - 1 ? spaceBetween : 0);
  }
}

export async function generateLetterPdf(letter: Letter): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;

  // Kop surat (letterhead) — use image with aspect-ratio height to avoid blur; single line under
  const kopWidth = pageWidth - margin * 2;
  const kopMaxHeight = 55;
  try {
    const { dataUrl, width: imgW, height: imgH } = await loadImageWithDimensions(KOP_SURAT_IMAGE_URL);
    const kopHeight = Math.min(kopMaxHeight, kopWidth * (imgH / imgW));
    doc.addImage(dataUrl, 'PNG', margin, y, kopWidth, kopHeight);
    y += kopHeight + 5;
  } catch {
    // Fallback: docx-format kop (logo left, 4 lines right) — same layout as docs/Kop Surat MGSULBAR.docx
    const logoSize = 22;
    const logoX = margin;
    const logoY = y;
    const textStartX = logoX + logoSize + 8;
    const headerY = logoY + 4;

    // Left: logo area — try logo-mgsulbar.png, else placeholder
    try {
      const logoDataUrl = await loadImageAsDataUrl(LOGO_MGSULBAR_URL);
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('IA', logoX + logoSize / 2 - 2, logoY + logoSize / 2 + 1);
      doc.setTextColor(0, 0, 0);
    }

    // Right: four lines (format as docx)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(KOP_TEXT.kopOrgName, textStartX, headerY);

    doc.setFontSize(12);
    doc.text(KOP_TEXT.kopSubtitle, textStartX, headerY + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(KOP_TEXT.kopAddress, textStartX, headerY + 12);
    doc.text(KOP_TEXT.kopContact, textStartX, headerY + 17);

    y = logoY + logoSize + 5;
  }

  // Single divider line under kop
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Letter Type & Reference
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(LETTER_TYPE_LABELS[letter.type] || letter.type, pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor: ${letter.referenceNumber}`, pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Meta information
  const leftColX = margin;
  const rightColX = margin + 25;

  doc.setFont('helvetica', 'normal');
  doc.text('Kepada', leftColX, y);
  doc.text(`: ${letter.to}`, rightColX, y);
  y += 6;

  doc.text('Dari', leftColX, y);
  doc.text(`: ${letter.from}`, rightColX, y);
  y += 6;

  doc.text('Tanggal', leftColX, y);
  doc.text(`: ${format(new Date(letter.createdAt), 'd MMMM yyyy', { locale: id })}`, rightColX, y);
  y += 6;

  doc.text('Perihal', leftColX, y);
  // Handle long subject with wrapping
  const subjectLines = doc.splitTextToSize(`: ${letter.subject}`, contentWidth - 30);
  doc.text(subjectLines, rightColX, y);
  y += subjectLines.length * 5 + 8;

  // Content – use letter font/size when available (jsPDF built-in: times, helvetica, courier)
  const fontMap: Record<string, string> = {
    'Times New Roman': 'times',
    'Georgia': 'times',
    'Cambria': 'times',
    'Arial': 'helvetica',
    'Calibri': 'helvetica',
    'Verdana': 'helvetica',
  };
  const pdfFont = fontMap[letter.fontFamily || ''] || 'times';
  doc.setFont(pdfFont, 'normal');
  const fontSizePt = letter.fontSize ?? 12;
  doc.setFontSize(fontSizePt);
  const lineHeightMm = Math.max(4, fontSizePt * (letter.lineHeight ?? 1.5) * 0.3528);
  const remainingHeight = doc.internal.pageSize.getHeight() - y - 60;
  const contentAlign = (letter.contentJustification || 'left') as 'left' | 'center' | 'right' | 'justify';
  const contentX = contentAlign === 'center' ? pageWidth / 2 : contentAlign === 'right' ? pageWidth - margin : leftColX;
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/55bae2bf-7bcd-493f-9377-31aad3707983', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'generateLetterPdf.ts:lineHeight', message: 'line spacing and content position', data: { lineHeightMm, fontSizePt, letterLineHeight: letter.lineHeight, letterFontSize: letter.fontSize, letterContentJustification: letter.contentJustification, contentAlign, contentX, leftColX, contentWidth }, hypothesisId: 'H4_H5', timestamp: Date.now() }) }).catch(() => {});
  // #endregion

  let bodyContent = letter.content || '';
  if (letter.type !== 'proposal' && hasEventDetailsPlaceholder(bodyContent) && hasEventDetailsValues(letter)) {
    bodyContent = bodyContent.replace(EVENT_DETAILS_PLACEHOLDER, formatEventDetailsAsText(letter));
  }

  if (letter.type === 'proposal' && letter.content) {
    let proposalFields: { latarBelakang?: string; tujuan?: string; anggaran?: string; timeline?: string } = {};
    try {
      proposalFields = JSON.parse(letter.content);
    } catch {
      proposalFields = {};
    }
    const sections = [
      { label: 'Latar Belakang', value: proposalFields.latarBelakang },
      { label: 'Tujuan', value: proposalFields.tujuan },
      { label: 'Anggaran', value: proposalFields.anggaran },
      { label: 'Timeline', value: proposalFields.timeline },
    ].filter((s) => s.value);
    sections.forEach((section) => {
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(`${section.label}:`, leftColX, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(section.value!, contentWidth);
      lines.forEach((line: string) => {
        if (y > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage();
          y = 20;
        }
        const proposalX = contentAlign === 'left' || contentAlign === 'justify' ? leftColX + 5 : contentX;
        if (contentAlign === 'justify') {
          drawJustifiedLine(doc, line, proposalX, y, contentWidth);
        } else {
          doc.text(line, proposalX, y, { align: contentAlign });
        }
        y += lineHeightMm;
      });
      y += 5;
    });
  } else if (isHtmlContent(bodyContent)) {
    const listIndent = 8;
    const pageBottom = doc.internal.pageSize.getHeight() - 30;
    const segments = htmlToSegments(bodyContent);
    const fontMap: Record<string, string> = {
      'Times New Roman': 'times',
      'Arial': 'helvetica',
      'Georgia': 'times',
      'Calibri': 'helvetica',
      'Cambria': 'times',
      'Verdana': 'helvetica',
    };
    const pdfFont = fontMap[letter.fontFamily || ''] || 'times';
    let prevWasListMarker = false;
    let segIndex = 0;

    for (const seg of segments) {
      if (seg.text === '\n') {
        if (y > pageBottom) {
          doc.addPage();
          y = 20;
        }
        y += lineHeightMm;
        segIndex += 1;
        continue;
      }
      const isListMarker = seg.text === '• ' || /^\d+\. $/.test(seg.text);
      const segX =
        seg.indent != null
          ? contentX + seg.indent
          : prevWasListMarker
            ? contentX + listIndent
            : contentX;
      const segWidth =
        seg.indent != null
          ? contentWidth - seg.indent
          : prevWasListMarker
            ? contentWidth - listIndent
            : contentWidth;
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/55bae2bf-7bcd-493f-9377-31aad3707983', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'generateLetterPdf.ts:segment', message: 'segment list alignment', data: { segIndex, textLen: seg.text.length, textSnippet: seg.text.slice(0, 35), textRepr: JSON.stringify(seg.text), isListMarker, prevWasListMarker, segX, listIndent, contentX }, hypothesisId: 'H1_H2_H3', timestamp: Date.now() }) }).catch(() => {});
      // #endregion

      const style = seg.bold && seg.italic ? 'bolditalic' : seg.bold ? 'bold' : seg.italic ? 'italic' : 'normal';
      doc.setFont(pdfFont, style);
      const lines = doc.splitTextToSize(seg.text, segWidth);
      for (const line of lines) {
        if (y > pageBottom) {
          doc.addPage();
          y = 20;
        }
        if (contentAlign === 'justify') {
          drawJustifiedLine(doc, line, segX, y, segWidth);
        } else {
          doc.text(line, segX, y, { align: contentAlign });
        }
        y += lineHeightMm;
      }
      // Keep list marker and first line of body on same line: undo one line advance after a list marker
      if (isListMarker) y -= lineHeightMm;
      prevWasListMarker = isListMarker;
      segIndex += 1;
    }
  } else {
    const listIndent = 8; // mm — body text starts to the right of the marker
    const paragraphs = bodyContent.split('\n');
    const pageBottom = doc.internal.pageSize.getHeight() - 30;

    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') {
        if (y > pageBottom) {
          doc.addPage();
          y = 20;
        }
        y += lineHeightMm;
        continue;
      }
      if (isListLine(paragraph)) {
        const parts = getListLineParts(paragraph);
        if (!parts) continue;
        const { markerPrefix, body } = parts;
        const bodyWrapped = doc.splitTextToSize(body, contentWidth - listIndent);
        const blockHeight = lineHeightMm * bodyWrapped.length;

        if (y + blockHeight > pageBottom) {
          doc.addPage();
          y = 20;
        }
        doc.text(markerPrefix, contentX, y);
        const listBodyWidth = contentWidth - listIndent;
        bodyWrapped.forEach((line: string, i: number) => {
          if (contentAlign === 'justify') {
            drawJustifiedLine(doc, line, contentX + listIndent, y + i * lineHeightMm, listBodyWidth);
          } else {
            doc.text(line, contentX + listIndent, y + i * lineHeightMm, { align: contentAlign });
          }
        });
        y += blockHeight;
      } else {
        const lines = doc.splitTextToSize(paragraph, contentWidth);
        for (let i = 0; i < lines.length; i++) {
          if (y > pageBottom) {
            doc.addPage();
            y = 20;
          }
          if (contentAlign === 'justify') {
            drawJustifiedLine(doc, lines[i], contentX, y, contentWidth);
          } else {
            doc.text(lines[i], contentX, y, { align: contentAlign });
          }
          y += lineHeightMm;
        }
      }
    }
  }

  y += 15;

  // Attachments section
  if (letter.attachments.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Lampiran:', leftColX, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    letter.attachments.forEach((att, index) => {
      doc.text(`${index + 1}. ${att.name}`, leftColX + 5, y);
      y += 5;
    });
    y += 10;
  }

  // Signature section
  const signatureX = pageWidth - margin - 60;
  y = Math.max(y, doc.internal.pageSize.getHeight() - 70);

  doc.text(`Jakarta, ${format(new Date(), 'd MMMM yyyy', { locale: id })}`, signatureX, y);
  y += 6;

  if (letter.signatures && letter.signatures.length > 0) {
    letter.signatures.forEach((sig) => {
      // Add signature image
      try {
        doc.addImage(sig.signatureDataUrl, 'PNG', signatureX, y, 40, 20);
        y += 22;
      } catch {
        y += 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(sig.signedBy.name, signatureX, y);
      y += 10;
    });
  } else {
    y += 25; // Space for manual signature
    doc.line(signatureX, y, signatureX + 50, y);
    y += 5;
    doc.text('(Tanda Tangan)', signatureX, y);
  }

  // Footer with document info
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Dokumen ini dicetak pada ${format(new Date(), 'd MMMM yyyy HH:mm', { locale: id })}`, margin, footerY);
  doc.text(`Ref: ${letter.referenceNumber}`, pageWidth - margin, footerY, { align: 'right' });

  // Save the PDF
  const filename = `${letter.type}_${letter.referenceNumber.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}
