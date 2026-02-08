import { getSheetsClient, readAll, ensureSheets, appendRow, SHEETS_NAMES } from '../sheets.js';

const PROGRAM_HEADERS = ['id', 'name', 'department', 'status', 'progress', 'startDate', 'endDate', 'pic'];

function rowToProgram(row) {
  const progress = row.progress !== '' && row.progress !== undefined ? Number(row.progress) : 0;
  return {
    id: row.id ?? '',
    name: row.name ?? '',
    department: row.department ?? '',
    status: row.status ?? 'Berjalan',
    progress: Number.isNaN(progress) ? 0 : Math.min(100, Math.max(0, progress)),
    startDate: row.startDate ?? '',
    endDate: row.endDate ?? '',
    pic: row.pic ?? '',
  };
}

export async function getPrograms() {
  const client = await getSheetsClient();
  if (!client) return [];
  await ensureSheets(client);
  const rows = await readAll(client, SHEETS_NAMES.PROGRAMS);
  return rows.map(rowToProgram).filter((p) => p.id !== '');
}

export async function createProgram(program) {
  const client = await getSheetsClient();
  if (!client) throw new Error('Google Sheets not configured');
  await ensureSheets(client);
  const row = {
    id: program.id ?? '',
    name: program.name ?? '',
    department: program.department ?? '',
    status: program.status ?? 'Berjalan',
    progress: program.progress ?? 0,
    startDate: program.startDate ?? '',
    endDate: program.endDate ?? '',
    pic: program.pic ?? '',
  };
  await appendRow(client, SHEETS_NAMES.PROGRAMS, PROGRAM_HEADERS, row);
  return rowToProgram(row);
}
