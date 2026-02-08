/**
 * Event details block for undangan template (Hari/Tanggal, Waktu, Tempat, Acara).
 * Use {{EVENT_DETAILS}} in template content; replace with HTML for preview or draw separately in PDF.
 */

const EVENT_LABELS = ['Hari/Tanggal', 'Waktu', 'Tempat', 'Acara'] as const;
const LABEL_WIDTH_CH = 14; // so colons align

export const EVENT_DETAILS_PLACEHOLDER = '{{EVENT_DETAILS}}';

export interface EventDetailsSource {
  eventDate?: string;
  eventWaktu?: string;
  /** Server/letter field name */
  eventLocation?: string;
  /** Form field name (Tempat) */
  eventTempat?: string;
  eventAcara?: string;
}

function getEventValues(src: EventDetailsSource): (string | undefined)[] {
  const tempat = src.eventLocation ?? src.eventTempat;
  return [src.eventDate, src.eventWaktu, tempat, src.eventAcara];
}

/** Returns HTML for the event block with aligned colons (label fixed width). */
export function formatEventDetailsHtml(src: EventDetailsSource): string {
  const values = getEventValues(src);
  const rows = EVENT_LABELS.map((label, i) => {
    const value = values[i]?.trim() || '';
    const labelSpan = `<span style="display:inline-block;width:${LABEL_WIDTH_CH}ch;flex-shrink:0">${escapeHtml(label)}</span>`;
    return `<div style="display:flex;align-items:baseline;gap:0.25em;margin-bottom:0.15em">${labelSpan}<span> : </span><span>${escapeHtml(value)}</span></div>`;
  });
  return `<div class="event-details" style="margin:0.5em 0">${rows.join('')}</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Returns lines for PDF: label padded to align colons, then value. */
export function formatEventDetailsLines(src: EventDetailsSource): { label: string; value: string }[] {
  return EVENT_LABELS.map((label, i) => {
    const value = (getEventValues(src)[i] ?? '').trim();
    const paddedLabel = label.padEnd(LABEL_WIDTH_CH);
    return { label: paddedLabel, value };
  });
}

/** Returns plain text block (newline-separated, padded labels) for PDF body replacement. */
export function formatEventDetailsAsText(src: EventDetailsSource): string {
  return formatEventDetailsLines(src)
    .map(({ label, value }) => `${label} : ${value}`)
    .join('\n');
}

export function hasEventDetailsPlaceholder(content: string): boolean {
  return typeof content === 'string' && content.includes(EVENT_DETAILS_PLACEHOLDER);
}

export function hasEventDetailsValues(src: EventDetailsSource): boolean {
  return getEventValues(src).some((v) => v != null && String(v).trim() !== '');
}
