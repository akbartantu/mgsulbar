import { getSheetsClient, readAll, ensureSheets, appendRow, updateRowByIndex, SHEETS_NAMES } from '../sheets.js';
import { getUserById } from './users.js';
import { getActivePeriod } from './periods.js';

const MEMBER_HEADERS = ['id', 'userId', 'periodId', 'name', 'role', 'department', 'email', 'status'];

export function rowToMember(row) {
  return {
    id: row.id ?? '',
    userId: row.userId ?? '',
    periodId: row.periodId ?? '',
    name: row.name ?? '',
    role: row.role ?? '',
    department: row.department ?? '',
    email: row.email ?? '',
    status: row.status ?? 'Aktif',
  };
}

export async function getMembers(periodId) {
  const client = await getSheetsClient();
  if (!client) return [];
  await ensureSheets(client);
  const rows = await readAll(client, SHEETS_NAMES.MEMBERS);
  let list = rows.map(rowToMember).filter((m) => m.id !== '');
  if (periodId) list = list.filter((m) => (m.periodId || '') === periodId);
  return list;
}

/** Members for the current (active) period only. Use for "Dari", approvers, tembusan. */
export async function getMembersForCurrentPeriod() {
  const active = await getActivePeriod();
  if (!active) return getMembers();
  return getMembers(active.id);
}

export async function createMember(member) {
  const client = await getSheetsClient();
  if (!client) throw new Error('Google Sheets not configured');
  await ensureSheets(client);
  const userId = (member.userId ?? '').trim();
  const periodId = (member.periodId ?? '').trim();
  if (userId) {
    const user = await getUserById(userId);
    if (!user) throw new Error('User not found');
    if ((user.status || 'active') !== 'active') {
      throw new Error('Hanya pengguna yang sudah disetujui (aktif) yang dapat ditugaskan sebagai anggota.');
    }
  }
  const row = {
    id: member.id ?? '',
    userId: member.userId ?? '',
    periodId: member.periodId ?? '',
    name: member.name ?? '',
    role: member.role ?? '',
    department: member.department ?? '',
    email: member.email ?? '',
    status: member.status ?? 'Aktif',
  };
  await appendRow(client, SHEETS_NAMES.MEMBERS, MEMBER_HEADERS, row);
  return rowToMember(row);
}

const ALLOWED_MEMBER_KEYS = ['userId', 'periodId', 'name', 'role', 'department', 'email', 'status'];

export async function updateMemberById(id, updates) {
  const client = await getSheetsClient();
  if (!client) return null;
  await ensureSheets(client);
  const rows = await readAll(client, SHEETS_NAMES.MEMBERS);
  const rowIndex = rows.findIndex((r) => (r.id || '') === id);
  if (rowIndex < 0) return null;
  const allowed = {};
  for (const key of ALLOWED_MEMBER_KEYS) {
    if (updates[key] !== undefined) allowed[key] = updates[key];
  }
  const merged = { ...rows[rowIndex], ...allowed };
  MEMBER_HEADERS.forEach((h) => {
    if (merged[h] === undefined) merged[h] = h === 'status' ? (rows[rowIndex].status || 'Aktif') : '';
  });
  await updateRowByIndex(client, SHEETS_NAMES.MEMBERS, rowIndex, MEMBER_HEADERS, merged);
  return rowToMember(merged);
}
