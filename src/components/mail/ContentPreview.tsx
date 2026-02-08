import React from 'react';
import { isListLine } from '@/hooks/useRichTextarea';
import { cn } from '@/lib/utils';
import { sanitizeHtml, isHtmlContent } from '@/lib/sanitizeHtml';

/** Parses inline markers ** * __ and returns React nodes for one line. */
function parseInlineFormats(line: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < line.length) {
    if (line.slice(i, i + 2) === '**') {
      const end = line.indexOf('**', i + 2);
      if (end === -1) {
        out.push(line.slice(i));
        break;
      }
      out.push(<strong key={`b-${i}`}>{line.slice(i + 2, end)}</strong>);
      i = end + 2;
      continue;
    }
    if (line.slice(i, i + 2) === '__') {
      const end = line.indexOf('__', i + 2);
      if (end === -1) {
        out.push(line.slice(i));
        break;
      }
      out.push(
        <span key={`u-${i}`} style={{ textDecoration: 'underline' }}>
          {line.slice(i + 2, end)}
        </span>
      );
      i = end + 2;
      continue;
    }
    if (line[i] === '*') {
      const end = line.indexOf('*', i + 1);
      if (end === -1 || end === i + 1) {
        out.push(line[i]);
        i++;
        continue;
      }
      out.push(<em key={`i-${i}`}>{line.slice(i + 1, end)}</em>);
      i = end + 1;
      continue;
    }
    const nextStar = line.indexOf('*', i);
    const nextDbl = line.indexOf('**', i);
    const nextUl = line.indexOf('__', i);
    const next = Math.min(
      nextStar >= 0 ? nextStar : line.length,
      nextDbl >= 0 ? nextDbl : line.length,
      nextUl >= 0 ? nextUl : line.length
    );
    if (next > i) out.push(line.slice(i, next));
    i = next > i ? next : i + 1;
  }
  return out;
}

export interface ContentPreviewProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Renders content: if HTML (WYSIWYG), sanitize and render; else plain text with ** * __ and list indent. */
export function ContentPreview({ content, className, style }: ContentPreviewProps) {
  const raw = content || '';
  if (isHtmlContent(raw)) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/55bae2bf-7bcd-493f-9377-31aad3707983',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContentPreview.tsx:preview-html',message:'Preview received HTML',data:{hasBlockquote:raw.includes('blockquote'),hasMarginLeft:/margin-left|marginLeft/.test(raw),contentSnippet:raw.slice(0,500)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    const safe = sanitizeHtml(raw);
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/55bae2bf-7bcd-493f-9377-31aad3707983',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContentPreview.tsx:after-sanitize',message:'After sanitize',data:{safeHasBlockquote:safe.includes('blockquote'),safeSnippet:safe.slice(0,400)},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    return (
      <div
        className={cn('break-words overflow-hidden [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-0.5 [&_blockquote]:border-l-0', className)}
        style={style}
        aria-hidden
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  }
  const lines = raw.split('\n');
  return (
    <div
      className={cn('whitespace-pre-wrap break-words overflow-hidden', className)}
      style={style}
      aria-hidden
    >
      {lines.map((line, idx) => {
        const isList = line.trim() !== '' && isListLine(line);
        const lineStyle: React.CSSProperties = isList
          ? {
              paddingLeft: '2.5ch',
              textIndent: '-2.5ch',
              marginBottom: '0.5em',
            }
          : line.trim() === ''
            ? { marginBottom: '0.25em' }
            : {};
        return (
          <div key={idx} style={lineStyle}>
            {parseInlineFormats(line)}
            {line === '' ? '\u00A0' : null}
          </div>
        );
      })}
    </div>
  );
}
