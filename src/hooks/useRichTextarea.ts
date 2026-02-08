import { useCallback, KeyboardEvent } from 'react';

// List marker patterns
const BULLET_MARKERS = ['• ', '◦ ', '▪ '];
const NUMBERED_REGEX = /^(\s*)(\d+)\.\s/;
const ALPHA_REGEX = /^(\s*)([a-z])\.\s/;
const ROMAN_REGEX = /^(\s*)(i{1,3}|iv|vi{0,3}|ix|xi{0,3})\.\s/i;
const BULLET_REGEX = /^(\s*)(•|◦|▪)\s/;

const ROMAN_NUMERALS = [
  'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x',
  'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx',
];

function nextRoman(current: string): string {
  const idx = ROMAN_NUMERALS.indexOf(current.toLowerCase());
  if (idx === -1 || idx + 1 >= ROMAN_NUMERALS.length) return ROMAN_NUMERALS[0];
  return ROMAN_NUMERALS[idx + 1];
}

function nextAlpha(current: string): string {
  const code = current.toLowerCase().charCodeAt(0);
  if (code >= 122) return 'a'; // wrap z → a
  return String.fromCharCode(code + 1);
}

interface ListMatch {
  indent: string;
  marker: string;
  nextMarker: string;
  fullMatch: string;
  type: 'number' | 'alpha' | 'roman' | 'bullet';
}

function detectListMarker(line: string): ListMatch | null {
  let m: RegExpMatchArray | null;

  m = line.match(NUMBERED_REGEX);
  if (m) {
    const num = parseInt(m[2]);
    return { indent: m[1], marker: `${m[2]}.`, nextMarker: `${num + 1}.`, fullMatch: m[0], type: 'number' };
  }

  m = line.match(ALPHA_REGEX);
  if (m) {
    return { indent: m[1], marker: `${m[2]}.`, nextMarker: `${nextAlpha(m[2])}.`, fullMatch: m[0], type: 'alpha' };
  }

  m = line.match(ROMAN_REGEX);
  if (m) {
    return { indent: m[1], marker: `${m[2]}.`, nextMarker: `${nextRoman(m[2])}.`, fullMatch: m[0], type: 'roman' };
  }

  m = line.match(BULLET_REGEX);
  if (m) {
    return { indent: m[1], marker: m[2], nextMarker: m[2], fullMatch: m[0], type: 'bullet' };
  }

  return null;
}

/** Returns true if the line starts with a list marker (number, alpha, roman, or bullet). Used for display (LetterDetailDialog, PDF). */
export function isListLine(line: string): boolean {
  return detectListMarker(line) !== null;
}

/** For a list line, returns the marker prefix and the body text. Returns null if not a list line. Used by PDF export. */
export function getListLineParts(line: string): { markerPrefix: string; body: string } | null {
  const m = detectListMarker(line);
  if (!m) return null;
  return { markerPrefix: m.fullMatch, body: line.slice(m.fullMatch.length) };
}

// Get the appropriate list marker for a given indent level and list family
function getMarkerForIndentLevel(indentLevel: number, family: 'ordered' | 'bullet'): string {
  if (family === 'bullet') {
    return BULLET_MARKERS[Math.min(indentLevel, BULLET_MARKERS.length - 1)];
  }
  // ordered family cycles: 1. → a. → i. → 1. ...
  const cycle = indentLevel % 3;
  if (cycle === 0) return '1. ';
  if (cycle === 1) return 'a. ';
  return 'i. ';
}

function getIndentLevel(indent: string): number {
  return Math.floor(indent.length / 4);
}

function isOrderedType(type: string): boolean {
  return type === 'number' || type === 'alpha' || type === 'roman';
}

export function useRichTextarea(
  value: string,
  onChange: (value: string) => void,
  textareaRef: React.RefObject<HTMLTextAreaElement>
) {
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      const { selectionStart } = textarea;
      const beforeCursor = value.substring(0, selectionStart);
      const afterCursor = value.substring(textarea.selectionEnd);

      // Find current line
      const lineStart = beforeCursor.lastIndexOf('\n') + 1;
      const currentLine = beforeCursor.substring(lineStart);

      const listMatch = detectListMarker(currentLine);
      if (!listMatch) return; // Not a list line, let default Enter happen

      e.preventDefault();

      // Check if current line content (after marker) is empty → remove marker (double Enter)
      const contentAfterMarker = currentLine.substring(listMatch.fullMatch.length).trim();
      if (contentAfterMarker === '') {
        // Remove the marker from current line
        const newValue = value.substring(0, lineStart) + afterCursor;
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = lineStart;
        }, 0);
        return;
      }

      // Add next list item
      const nextLine = `\n${listMatch.indent}${listMatch.nextMarker} `;
      const newValue = beforeCursor + nextLine + afterCursor;
      onChange(newValue);
      setTimeout(() => {
        const newPos = selectionStart + nextLine.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
      }, 0);
    }

    // Tab for indentation within lists
    if (e.key === 'Tab') {
      const { selectionStart } = textarea;
      const beforeCursor = value.substring(0, selectionStart);
      const afterCursor = value.substring(textarea.selectionEnd);

      const lineStart = beforeCursor.lastIndexOf('\n') + 1;
      const lineEnd = value.indexOf('\n', selectionStart);
      const currentLineEnd = lineEnd === -1 ? value.length : lineEnd;
      const currentLine = value.substring(lineStart, currentLineEnd);

      const listMatch = detectListMarker(currentLine);
      if (!listMatch) return;

      e.preventDefault();

      const currentIndent = listMatch.indent;
      const currentLevel = getIndentLevel(currentIndent);
      const contentAfterMarker = currentLine.substring(listMatch.fullMatch.length);
      const family = isOrderedType(listMatch.type) ? 'ordered' : 'bullet';

      let newLevel: number;
      if (e.shiftKey) {
        newLevel = Math.max(0, currentLevel - 1);
      } else {
        newLevel = currentLevel + 1;
      }

      const newIndent = '    '.repeat(newLevel);
      const newMarker = getMarkerForIndentLevel(newLevel, family as 'ordered' | 'bullet');
      const newLine = `${newIndent}${newMarker}${contentAfterMarker}`;

      const newValue = value.substring(0, lineStart) + newLine + value.substring(currentLineEnd);
      onChange(newValue);
      setTimeout(() => {
        const newPos = lineStart + newIndent.length + newMarker.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
      }, 0);
    }
  }, [value, onChange, textareaRef]);

  // Toolbar actions
  const wrapSelection = useCallback((before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const selected = value.substring(selectionStart, selectionEnd);

    // Toggle: if already wrapped, unwrap
    const textBefore = value.substring(Math.max(0, selectionStart - before.length), selectionStart);
    const textAfter = value.substring(selectionEnd, selectionEnd + after.length);

    let newValue: string;
    let newStart: number;
    let newEnd: number;

    if (textBefore === before && textAfter === after) {
      // Unwrap: markers are outside the selection
      newValue = value.substring(0, selectionStart - before.length) + selected + value.substring(selectionEnd + after.length);
      newStart = selectionStart - before.length;
      newEnd = newStart + selected.length;
    } else if (
      selected.length >= before.length + after.length &&
      selected.startsWith(before) &&
      selected.endsWith(after)
    ) {
      // Unwrap: selection itself includes the markers (e.g. user selected "**text**")
      const inner = selected.slice(before.length, -after.length);
      newValue = value.substring(0, selectionStart) + inner + value.substring(selectionEnd);
      newStart = selectionStart;
      newEnd = selectionStart + inner.length;
    } else {
      // Wrap
      newValue = value.substring(0, selectionStart) + before + selected + after + value.substring(selectionEnd);
      newStart = selectionStart + before.length;
      newEnd = newStart + selected.length;
    }

    onChange(newValue);
    setTimeout(() => {
      textarea.selectionStart = newStart;
      textarea.selectionEnd = newEnd;
      textarea.focus();
    }, 0);
  }, [value, onChange, textareaRef]);

  const toggleBold = useCallback(() => wrapSelection('**', '**'), [wrapSelection]);
  const toggleItalic = useCallback(() => wrapSelection('*', '*'), [wrapSelection]);
  const toggleUnderline = useCallback(() => wrapSelection('__', '__'), [wrapSelection]);

  const getSelectedLines = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return { lines: [''], start: 0, end: 0, cursorOffset: 0 };
    const { selectionStart, selectionEnd } = textarea;
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    let lineEnd = value.indexOf('\n', selectionEnd);
    if (lineEnd === -1) lineEnd = value.length;
    return {
      lines: value.substring(lineStart, lineEnd).split('\n'),
      start: lineStart,
      end: lineEnd,
      cursorOffset: selectionStart - lineStart,
    };
  }, [value, textareaRef]);

  const replaceLines = useCallback((newLines: string[], start: number, end: number, cursorOffset: number) => {
    const newText = newLines.join('\n');
    onChange(value.substring(0, start) + newText + value.substring(end));
    // Restore cursor to roughly the same position within the line
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const newPos = Math.min(start + Math.min(cursorOffset, newLines[0].length), start + newText.length);
      textarea.selectionStart = textarea.selectionEnd = newPos;
      textarea.focus();
    }, 0);
  }, [value, onChange, textareaRef]);

  const toggleBullet = useCallback(() => {
    const { lines, start, end, cursorOffset } = getSelectedLines();
    const allHave = lines.every(l => BULLET_REGEX.test(l));
    const newLines = lines.map(line => {
      if (allHave) return line.replace(BULLET_REGEX, '$1');
      const cleaned = line.replace(NUMBERED_REGEX, '$1').replace(ALPHA_REGEX, '$1').replace(ROMAN_REGEX, '$1').replace(BULLET_REGEX, '$1');
      const indent = cleaned.match(/^(\s*)/)?.[0] || '';
      const content = cleaned.trimStart();
      const level = getIndentLevel(indent);
      const marker = BULLET_MARKERS[Math.min(level, BULLET_MARKERS.length - 1)];
      return `${indent}${marker}${content}`;
    });
    replaceLines(newLines, start, end, cursorOffset);
  }, [getSelectedLines, replaceLines]);

  const toggleNumbered = useCallback(() => {
    const { lines, start, end, cursorOffset } = getSelectedLines();
    const allHave = lines.every(l => NUMBERED_REGEX.test(l));
    const newLines = lines.map((line, i) => {
      if (allHave) return line.replace(NUMBERED_REGEX, '$1');
      const cleaned = line.replace(NUMBERED_REGEX, '$1').replace(ALPHA_REGEX, '$1').replace(ROMAN_REGEX, '$1').replace(BULLET_REGEX, '$1');
      const indent = cleaned.match(/^(\s*)/)?.[0] || '';
      const content = cleaned.trimStart();
      return `${indent}${i + 1}. ${content}`;
    });
    replaceLines(newLines, start, end, cursorOffset);
  }, [getSelectedLines, replaceLines]);

  const toggleAlpha = useCallback(() => {
    const { lines, start, end, cursorOffset } = getSelectedLines();
    const allHave = lines.every(l => ALPHA_REGEX.test(l));
    const newLines = lines.map((line, i) => {
      if (allHave) return line.replace(ALPHA_REGEX, '$1');
      const cleaned = line.replace(NUMBERED_REGEX, '$1').replace(ALPHA_REGEX, '$1').replace(ROMAN_REGEX, '$1').replace(BULLET_REGEX, '$1');
      const indent = cleaned.match(/^(\s*)/)?.[0] || '';
      const content = cleaned.trimStart();
      const letter = String.fromCharCode(97 + (i % 26)); // a-z
      return `${indent}${letter}. ${content}`;
    });
    replaceLines(newLines, start, end, cursorOffset);
  }, [getSelectedLines, replaceLines]);

  const toggleRoman = useCallback(() => {
    const { lines, start, end, cursorOffset } = getSelectedLines();
    const allHave = lines.every(l => ROMAN_REGEX.test(l));
    const newLines = lines.map((line, i) => {
      if (allHave) return line.replace(ROMAN_REGEX, '$1');
      const cleaned = line.replace(NUMBERED_REGEX, '$1').replace(ALPHA_REGEX, '$1').replace(ROMAN_REGEX, '$1').replace(BULLET_REGEX, '$1');
      const indent = cleaned.match(/^(\s*)/)?.[0] || '';
      const content = cleaned.trimStart();
      return `${indent}${ROMAN_NUMERALS[i] || ROMAN_NUMERALS[0]}. ${content}`;
    });
    replaceLines(newLines, start, end, cursorOffset);
  }, [getSelectedLines, replaceLines]);

  const indentLines = useCallback(() => {
    const { lines, start, end, cursorOffset } = getSelectedLines();
    const newLines = lines.map(line => {
      const listMatch = detectListMarker(line);
      if (!listMatch) return '    ' + line;
      const contentAfterMarker = line.substring(listMatch.fullMatch.length);
      const newLevel = getIndentLevel(listMatch.indent) + 1;
      const newIndent = '    '.repeat(newLevel);
      const family = isOrderedType(listMatch.type) ? 'ordered' : 'bullet';
      const newMarker = getMarkerForIndentLevel(newLevel, family as 'ordered' | 'bullet');
      return `${newIndent}${newMarker}${contentAfterMarker}`;
    });
    replaceLines(newLines, start, end, cursorOffset + 4);
  }, [getSelectedLines, replaceLines]);

  const outdentLines = useCallback(() => {
    const { lines, start, end, cursorOffset } = getSelectedLines();
    const newLines = lines.map(line => {
      const listMatch = detectListMarker(line);
      if (!listMatch) {
        if (line.startsWith('    ')) return line.substring(4);
        if (line.startsWith('\t')) return line.substring(1);
        return line.replace(/^\s+/, '');
      }
      const currentLevel = getIndentLevel(listMatch.indent);
      if (currentLevel === 0) return line;
      const contentAfterMarker = line.substring(listMatch.fullMatch.length);
      const newLevel = currentLevel - 1;
      const newIndent = '    '.repeat(newLevel);
      const family = isOrderedType(listMatch.type) ? 'ordered' : 'bullet';
      const newMarker = getMarkerForIndentLevel(newLevel, family as 'ordered' | 'bullet');
      return `${newIndent}${newMarker}${contentAfterMarker}`;
    });
    replaceLines(newLines, start, end, Math.max(0, cursorOffset - 4));
  }, [getSelectedLines, replaceLines]);

  const clearList = useCallback(() => {
    const { lines, start, end, cursorOffset } = getSelectedLines();
    const newLines = lines.map(line =>
      line
        .replace(NUMBERED_REGEX, '$1')
        .replace(ALPHA_REGEX, '$1')
        .replace(ROMAN_REGEX, '$1')
        .replace(BULLET_REGEX, '$1')
    );
    replaceLines(newLines, start, end, cursorOffset);
  }, [getSelectedLines, replaceLines]);

  return {
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
