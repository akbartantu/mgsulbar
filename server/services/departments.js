import { getSheetsClient, readAll, ensureSheets, appendRow, updateRowByIndex, SHEETS_NAMES } from '../sheets.js';
import { getActivePeriod } from './periods.js';

const DEPARTMENT_HEADERS = ['id', 'name', 'periodId', 'sortOrder'];

function rowToDepartment(row) {
  return {
    id: row.id ?? '',
    name: row.name ?? '',
    periodId: row.periodId ?? '',
    sortOrder: parseInt(row.sortOrder, 10) || 0,
  };
}

export async function getDepartments(periodId) {
  const client = await getSheetsClient();
  if (!client) return [];
  await ensureSheets(client);
  const rows = await readAll(client, SHEETS_NAMES.DEPARTMENTS);
  let list = rows.map(rowToDepartment).filter((d) => d.id !== '');
  if (periodId) {
    list = list.filter((d) => d.periodId === periodId);
  }
  list.sort((a, b) => a.sortOrder - b.sortOrder);
  return list;
}

export async function getDepartmentsForCurrentPeriod() {
  const active = await getActivePeriod();
  if (!active) return [];
  return getDepartments(active.id);
}

export async function createDepartment(data) {
  const client = await getSheetsClient();
  if (!client) throw new Error('Google Sheets not configured');
  await ensureSheets(client);
  const id = data.id ?? `D${Date.now()}`;
  const row = {
    id,
    name: (data.name ?? '').trim() || 'Departemen Baru',
    periodId: data.periodId ?? '',
    sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : (parseInt(data.sortOrder, 10) || 0),
  };
  await appendRow(client, SHEETS_NAMES.DEPARTMENTS, DEPARTMENT_HEADERS, row);
  return rowToDepartment(row);
}

const ALLOWED_DEPARTMENT_KEYS = ['name', 'periodId', 'sortOrder'];

export async function updateDepartment(id, updates) {
  const client = await getSheetsClient();
  if (!client) return null;
  await ensureSheets(client);
  const rows = await readAll(client, SHEETS_NAMES.DEPARTMENTS);
  const rowIndex = rows.findIndex((r) => (r.id || '') === id);
  if (rowIndex < 0) return null;
  const allowed = {};
  for (const key of ALLOWED_DEPARTMENT_KEYS) {
    if (updates[key] !== undefined) allowed[key] = updates[key];
  }
  const merged = { ...rows[rowIndex], ...allowed };
  const rowObj = {
    id: merged.id ?? rows[rowIndex].id,
    name: merged.name ?? rows[rowIndex].name,
    periodId: merged.periodId ?? rows[rowIndex].periodId,
    sortOrder: typeof merged.sortOrder === 'number' ? merged.sortOrder : (parseInt(merged.sortOrder, 10) || 0),
  };
  await updateRowByIndex(client, SHEETS_NAMES.DEPARTMENTS, rowIndex, DEPARTMENT_HEADERS, rowObj);
  return rowToDepartment(rowObj);
}

export async function deleteDepartment(id) {
  const client = await getSheetsClient();
  if (!client) return false;
  await ensureSheets(client);
  const rows = await readAll(client, SHEETS_NAMES.DEPARTMENTS);
  const rowIndex = rows.findIndex((r) => (r.id || '') === id);
  if (rowIndex < 0) return false;
  await updateRowByIndex(client, SHEETS_NAMES.DEPARTMENTS, rowIndex, DEPARTMENT_HEADERS, {
    id: '',
    name: '',
    periodId: '',
    sortOrder: 0,
  });
  return true;
}
