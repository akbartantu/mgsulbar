import { getSheetsClient, readAll, ensureSheets, appendRow, SHEETS_NAMES } from '../sheets.js';

const LETTER_READS_HEADERS = ['userId', 'letterId', 'readAt'];

/**
 * Returns a Set of letter ids that the user has read (opened).
 * On failure or missing sheet, returns empty Set.
 */
const log = (msg, data) => fetch('http://127.0.0.1:7246/ingest/55bae2bf-7bcd-493f-9377-31aad3707983',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'letterReads.js:getReadLetterIds',message:msg,data:data||{},timestamp:Date.now()})}).catch(()=>{});

export async function getReadLetterIds(userId) {
  if (!userId) return new Set();
  const client = await getSheetsClient();
  if (!client) return new Set();
  try {
    log('getReadLetterIds before ensureSheets', {});
    await ensureSheets(client);
    log('getReadLetterIds after ensureSheets', {});
    const rows = await readAll(client, SHEETS_NAMES.LETTER_READS);
    log('getReadLetterIds after readAll', { rowCount: rows?.length });
    const ids = new Set();
    for (const row of rows) {
      if ((row.userId || '').trim() === String(userId).trim() && (row.letterId || '').trim()) {
        ids.add(String(row.letterId).trim());
      }
    }
    return ids;
  } catch (e) {
    log('getReadLetterIds catch', { errMessage: e?.message, errName: e?.name });
    return new Set();
  }
}

/**
 * Mark a letter as read by the user. Idempotent: if already read, does not duplicate.
 */
export async function markAsRead(userId, letterId) {
  if (!userId || !letterId) return;
  const client = await getSheetsClient();
  if (!client) throw new Error('Google Sheets not configured');
  await ensureSheets(client);
  const existing = await getReadLetterIds(userId);
  if (existing.has(String(letterId).trim())) return;
  const row = {
    userId: String(userId).trim(),
    letterId: String(letterId).trim(),
    readAt: new Date().toISOString(),
  };
  await appendRow(client, SHEETS_NAMES.LETTER_READS, LETTER_READS_HEADERS, row);
}
