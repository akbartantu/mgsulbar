import { useCallback, useEffect, useRef, KeyboardEvent } from 'react';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

/** Convert plain text (legacy) to minimal HTML for display in contenteditable. */
export function plainToHtml(plain: string): string {
  if (!plain) return '<p><br></p>';
  const escaped = plain
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const withBr = escaped.replace(/\n/g, '<br>');
  return withBr.includes('<') ? withBr : `<p>${withBr}</p>`;
}

/** Normalize value for editor: if it looks like HTML use it, else convert plain to HTML. */
export function valueToEditorHtml(value: string): string {
  if (!value || !value.trim()) return '<p><br></p>';
  const trimmed = value.trim();
  if (trimmed.startsWith('<') && trimmed.includes('>')) return value;
  return plainToHtml(value);
}

export type ListStyleType = 'decimal' | 'lower-alpha' | 'lower-roman' | 'disc';

function isOrdered(style: ListStyleType): boolean {
  return style !== 'disc';
}

/** Get current list element and its effective style from selection, or null if not in a list. */
function getCurrentListState(): { list: HTMLOListElement | HTMLUListElement; style: ListStyleType } | null {
  const sel = window.getSelection();
  const node = sel?.anchorNode;
  if (!node) return null;
  const elOrParent = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : (node.parentElement ?? null);
  if (!elOrParent) return null;
  const ol = elOrParent.closest('ol');
  const ul = elOrParent.closest('ul');
  if (ol) {
    const raw = ol.style?.listStyleType || window.getComputedStyle(ol).listStyleType || '';
    const normalized = raw.trim().toLowerCase();
    const style: ListStyleType =
      normalized === 'lower-alpha' ? 'lower-alpha' : normalized === 'lower-roman' ? 'lower-roman' : 'decimal';
    return { list: ol, style };
  }
  if (ul) return { list: ul, style: 'disc' };
  return null;
}

/** Replace list element with a new tag (ol or ul), preserving li children and optional list-style-type. */
function replaceList(
  list: HTMLOListElement | HTMLUListElement,
  newTag: 'ol' | 'ul',
  listStyleType?: ListStyleType
): void {
  const doc = list.ownerDocument;
  const parent = list.parentNode;
  if (!parent) return;
  const newList = doc.createElement(newTag);
  if (newTag === 'ol' && listStyleType && listStyleType !== 'decimal') {
    newList.style.listStyleType = listStyleType;
  }
  while (list.firstChild) {
    newList.appendChild(list.firstChild);
  }
  parent.replaceChild(newList, list);
}

export function useContentEditable(
  value: string,
  onChange: (html: string) => void,
  enabled: boolean
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const lastValueRef = useRef(value);

  // Sync external value into editor (e.g. load letter, or switch from proposal)
  useEffect(() => {
    if (!enabled || !editorRef.current) return;
    const html = valueToEditorHtml(value);
    if (lastValueRef.current === value) return;
    lastValueRef.current = value;
    const el = editorRef.current;
    if (el.innerHTML !== html) {
      el.innerHTML = html;
    }
  }, [value, enabled]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    lastValueRef.current = html;
    isInternalChange.current = true;
    onChange(html);
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    emitChange();
  }, [emitChange]);

  const handleBlur = useCallback(() => {
    emitChange();
  }, [emitChange]);

  const exec = useCallback((cmd: string, value?: string) => {
    const el = editorRef.current;
    if (!el || !enabled) return;
    el.focus();
    document.execCommand(cmd, false, value);
    emitChange();
  }, [enabled, emitChange]);

  /** Apply list style: switch in place, or remove if same type, or insert new list if not in list. */
  const applyListStyle = useCallback((requested: ListStyleType) => {
    const el = editorRef.current;
    if (!el || !enabled) return;
    el.focus();
    const current = getCurrentListState();

    // Same type → remove list (toggle off)
    if (current && current.style === requested) {
      if (current.list.tagName === 'OL') {
        document.execCommand('insertOrderedList', false);
      } else {
        document.execCommand('insertUnorderedList', false);
      }
      emitChange();
      return;
    }

    // In ol, requested other ordered style → change list-style-type only
    if (current?.list.tagName === 'OL' && isOrdered(requested)) {
      (current.list as HTMLOListElement).style.listStyleType = requested;
      emitChange();
      return;
    }

    // In ul, requested ordered → replace ul with ol and set list-style-type
    if (current?.list.tagName === 'UL' && isOrdered(requested)) {
      replaceList(current.list, 'ol', requested);
      emitChange();
      return;
    }

    // In ol, requested disc → replace ol with ul
    if (current?.list.tagName === 'OL' && requested === 'disc') {
      replaceList(current.list, 'ul');
      emitChange();
      return;
    }

    // Not in a list → insert new list
    if (requested === 'disc') {
      document.execCommand('insertUnorderedList', false);
    } else {
      document.execCommand('insertOrderedList', false);
      const sel = window.getSelection();
      const node = sel?.anchorNode;
      const elOrParent = node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : (node?.parentElement ?? null);
      const ol = elOrParent?.closest?.('ol');
      if (ol) (ol as HTMLOListElement).style.listStyleType = requested;
    }
    emitChange();
  }, [enabled, emitChange]);

  const toggleBold = useCallback(() => exec('bold'), [exec]);
  const toggleItalic = useCallback(() => exec('italic'), [exec]);
  const toggleUnderline = useCallback(() => exec('underline'), [exec]);
  const toggleBullet = useCallback(() => applyListStyle('disc'), [applyListStyle]);
  const toggleNumbered = useCallback(() => applyListStyle('decimal'), [applyListStyle]);
  const toggleAlpha = useCallback(() => applyListStyle('lower-alpha'), [applyListStyle]);
  const toggleRoman = useCallback(() => applyListStyle('lower-roman'), [applyListStyle]);
  const clearList = useCallback(() => {
    const el = editorRef.current;
    if (!el || !enabled) return;
    el.focus();
    document.execCommand('outdent', false);
    document.execCommand('formatBlock', false, 'p');
    emitChange();
  }, [enabled, emitChange]);
  const indentLines = useCallback(() => exec('indent'), [exec]);
  const outdentLines = useCallback(() => exec('outdent'), [exec]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    // Optional: handle shortcuts (e.g. Ctrl+B) — execCommand is already applied by browser
  }, []);

  return {
    editorRef,
    handleInput,
    handleBlur,
    handleKeyDown,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleBullet,
    toggleNumbered,
    toggleAlpha,
    toggleRoman,
    clearList,
    indentLines,
    outdentLines,
  };
}
