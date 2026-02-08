import { getSheetsClient, readAll, ensureSheets, appendRow, SHEETS_NAMES } from '../sheets.js';

const AWARDEE_HEADERS = ['id', 'name', 'university', 'major', 'year', 'status'];

function rowToAwardee(row) {
  const year = row.year !== '' && row.year !== undefined ? Number(row.year) : new Date().getFullYear();
  return {
    id: row.id ?? '',
    name: row.name ?? '',
    university: row.university ?? '',
    major: row.major ?? '',
    year: Number.isNaN(year) ? new Date().getFullYear() : year,
    status: row.status ?? 'Aktif',
  };
}

export async function getAwardees() {
  const client = await getSheetsClient();
  if (!client) return [];
  await ensureSheets(client);
  const rows = await readAll(client, SHEETS_NAMES.AWARDEES);
  return rows.map(rowToAwardee).filter((a) => a.id !== '');
}

export async function createAwardee(awardee) {
  const client = await getSheetsClient();
  if (!client) throw new Error('Google Sheets not configured');
  await ensureSheets(client);
  const row = {
    id: awardee.id ?? '',
    name: awardee.name ?? '',
    university: awardee.university ?? '',
    major: awardee.major ?? '',
    year: awardee.year ?? '',
    status: awardee.status ?? 'Aktif',
  };
  await appendRow(client, SHEETS_NAMES.AWARDEES, AWARDEE_HEADERS, row);
  return rowToAwardee(row);
}
