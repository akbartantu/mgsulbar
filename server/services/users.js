import { getSheetsClient, readAll, ensureSheets, appendRow, updateRowByIndex, SHEETS_NAMES } from '../sheets.js';

const USER_HEADERS = ['id', 'name', 'email', 'role', 'passwordHash', 'status', 'approvedAt', 'approvedById'];

export function rowToUser(row) {
  return {
    id: row.id || '',
    name: row.name || '',
    email: row.email || '',
    role: row.role || 'viewer',
    status: row.status || 'active',
    approvedAt: row.approvedAt || undefined,
    approvedById: row.approvedById || undefined,
  };
}

export async function getUsers() {
  const client = await getSheetsClient();
  if (!client) return [];
  await ensureSheets(client);
  const rows = await readAll(client, SHEETS_NAMES.USERS);
  return rows.map(rowToUser).filter((u) => u.id);
}

export async function getUsersMap() {
  const users = await getUsers();
  const map = {};
  users.forEach((u) => { map[u.id] = u; });
  return map;
}

export async function getUserById(id) {
  if (!id) return null;
  const users = await getUsers();
  return users.find((u) => u.id === id) || null;
}

export async function getUserByEmail(email) {
  if (!email) return null;
  const users = await getUsers();
  return users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function getUserWithPasswordByEmail(email) {
  if (!email) return null;
  const client = await getSheetsClient();
  if (!client) return null;
  await ensureSheets(client);
  const rows = await readAll(client, SHEETS_NAMES.USERS);
  return rows.find((r) => (r.email || '').toLowerCase() === (email || '').toLowerCase()) || null;
}

export async function createUser(user) {
  const client = await getSheetsClient();
  if (!client) throw new Error('Google Sheets not configured');
  await ensureSheets(client);
  const row = {
    id: user.id || '',
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'viewer',
    passwordHash: user.passwordHash || '',
    status: user.status || 'pending',
    approvedAt: user.approvedAt || '',
    approvedById: user.approvedById || '',
  };
  await appendRow(client, SHEETS_NAMES.USERS, USER_HEADERS, row);
  const { passwordHash: _, ...userResponse } = row;
  return { ...userResponse, status: row.status || 'pending' };
}

const ALLOWED_PROFILE_KEYS = ['name'];
const ALLOWED_ADMIN_USER_KEYS = ['name', 'role', 'status', 'approvedAt', 'approvedById'];

export async function updateUserById(id, updates) {
  const client = await getSheetsClient();
  if (!client) return null;
  await ensureSheets(client);
  const rows = await readAll(client, SHEETS_NAMES.USERS);
  const rowIndex = rows.findIndex((r) => (r.id || '') === id);
  if (rowIndex < 0) return null;
  const allowed = {};
  for (const key of ALLOWED_PROFILE_KEYS) {
    if (updates[key] !== undefined) allowed[key] = updates[key];
  }
  const merged = { ...rows[rowIndex], ...allowed };
  USER_HEADERS.forEach((h) => {
    if (merged[h] === undefined) merged[h] = h === 'status' ? (rows[rowIndex].status || 'active') : '';
  });
  await updateRowByIndex(client, SHEETS_NAMES.USERS, rowIndex, USER_HEADERS, merged);
  return rowToUser(merged);
}

export async function updateUserByIdAdmin(id, updates) {
  const client = await getSheetsClient();
  if (!client) return null;
  await ensureSheets(client);
  const rows = await readAll(client, SHEETS_NAMES.USERS);
  const rowIndex = rows.findIndex((r) => (r.id || '') === id);
  if (rowIndex < 0) return null;
  const allowed = {};
  for (const key of ALLOWED_ADMIN_USER_KEYS) {
    if (updates[key] !== undefined) allowed[key] = updates[key];
  }
  const merged = { ...rows[rowIndex], ...allowed };
  USER_HEADERS.forEach((h) => {
    if (merged[h] === undefined) merged[h] = h === 'status' ? (rows[rowIndex].status || 'active') : '';
  });
  await updateRowByIndex(client, SHEETS_NAMES.USERS, rowIndex, USER_HEADERS, merged);
  return rowToUser(merged);
}
