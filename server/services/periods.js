import { getSheetsClient, readAll, ensureSheets, appendRow, updateRowByIndex, SHEETS_NAMES } from '../sheets.js';

const PERIOD_HEADERS = ['id', 'name', 'startDate', 'endDate', 'isActive'];

function rowToPeriod(row) {
  return {
    id: row.id ?? '',
    name: row.name ?? '',
    startDate: row.startDate ?? '',
    endDate: row.endDate ?? '',
    isActive: (row.isActive ?? '').toString().toLowerCase() === 'true',
  };
}

export async function getPeriods() {
  const client = await getSheetsClient();
  if (!client) return [];
  await ensureSheets(client);
  const rows = await readAll(client, SHEETS_NAMES.PERIODS);
  return rows.map(rowToPeriod).filter((p) => p.id !== '');
}

export async function getActivePeriod() {
  const periods = await getPeriods();
  return periods.find((p) => p.isActive) || periods[0] || null;
}

export async function createPeriod(data) {
  const client = await getSheetsClient();
  if (!client) throw new Error('Google Sheets not configured');
  await ensureSheets(client);
  const id = data.id ?? `P${Date.now()}`;
  const isActive = (data.isActive ?? false) === true;
  const row = {
    id,
    name: (data.name ?? '').trim() || 'Periode Baru',
    startDate: data.startDate ?? '',
    endDate: data.endDate ?? '',
    isActive: isActive ? 'true' : 'false',
  };
  if (isActive) {
    const rows = await readAll(client, SHEETS_NAMES.PERIODS);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if ((r.id || '').toString().trim() === '') continue;
      await updateRowByIndex(client, SHEETS_NAMES.PERIODS, i, PERIOD_HEADERS, {
        id: r.id ?? '',
        name: r.name ?? '',
        startDate: r.startDate ?? '',
        endDate: r.endDate ?? '',
        isActive: 'false',
      });
    }
  }
  await appendRow(client, SHEETS_NAMES.PERIODS, PERIOD_HEADERS, row);
  return rowToPeriod(row);
}

const ALLOWED_PERIOD_KEYS = ['name', 'startDate', 'endDate', 'isActive'];

export async function updatePeriod(id, updates) {
  const client = await getSheetsClient();
  if (!client) return null;
  await ensureSheets(client);
  const rows = await readAll(client, SHEETS_NAMES.PERIODS);
  const rowIndex = rows.findIndex((r) => (r.id || '') === id);
  if (rowIndex < 0) return null;
  const allowed = {};
  for (const key of ALLOWED_PERIOD_KEYS) {
    if (updates[key] !== undefined) allowed[key] = updates[key];
  }
  const current = rows[rowIndex];
  let merged = { ...current, ...allowed };
  if (merged.isActive === true || (typeof merged.isActive === 'string' && merged.isActive.toString().toLowerCase() === 'true')) {
    for (let i = 0; i < rows.length; i++) {
      if (i === rowIndex) continue;
      const p = rows[i];
      if ((p.id || '') === '') continue;
      await updateRowByIndex(client, SHEETS_NAMES.PERIODS, i, PERIOD_HEADERS, {
        id: p.id,
        name: p.name,
        startDate: p.startDate,
        endDate: p.endDate,
        isActive: 'false',
      });
    }
    merged = { ...merged, isActive: 'true' };
  } else {
    merged.isActive = merged.isActive === false || merged.isActive === 'false' ? 'false' : (current.isActive ?? 'false');
  }
  const rowObj = {
    id: merged.id ?? current.id,
    name: merged.name ?? current.name,
    startDate: merged.startDate ?? current.startDate,
    endDate: merged.endDate ?? current.endDate,
    isActive: typeof merged.isActive === 'string' ? merged.isActive : (merged.isActive ? 'true' : 'false'),
  };
  await updateRowByIndex(client, SHEETS_NAMES.PERIODS, rowIndex, PERIOD_HEADERS, rowObj);
  return rowToPeriod(rowObj);
}
