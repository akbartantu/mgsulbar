import { getSheetsClient, readAll, appendRow, updateRowByIndex, ensureSheets, SHEETS_NAMES } from '../sheets.js';
import { getUsersMap } from './users.js';
import * as membersService from './members.js';

const LETTER_HEADERS = [
  'id', 'referenceNumber', 'type', 'subject', 'content', 'status', 'priority', 'classification',
  'from', 'to', 'createdAt', 'updatedAt', 'createdBy', 'sentAt', 'receivedAt', 'dueDate',
  'eventDate', 'eventWaktu', 'eventLocation', 'eventAcara', 'dispositionNote', 'attachments', 'approvalSteps', 'statusHistory',
  'cc', 'signatures', 'forwardedTo', 'fromDepartment', 'contentJustification', 'lineHeight', 'letterSpacing', 'fontFamily', 'fontSize',
];

function safeJson(str, fallback = []) {
  if (!str || typeof str !== 'string') return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function resolveApprovalSteps(steps, usersMap) {
  if (!Array.isArray(steps)) return [];
  return steps.map((s) => ({
    ...s,
    approver: usersMap[s.approverId] || s.approver,
  })).filter((s) => s.approver);
}

function resolveStatusHistory(history, usersMap) {
  if (!Array.isArray(history)) return [];
  return history.map((h) => ({
    ...h,
    changedBy: usersMap[h.changedById] || h.changedBy,
  })).filter((h) => h.changedBy);
}

function resolveForwardedTo(ids, usersMap) {
  if (!Array.isArray(ids)) return [];
  return ids.map((id) => usersMap[id]).filter(Boolean);
}

function resolveCcDisplay(ccIds, idToNameMap) {
  if (!Array.isArray(ccIds)) return [];
  return ccIds.map((id) => (typeof idToNameMap[id] === 'string' ? idToNameMap[id] : idToNameMap[id]?.name)).filter(Boolean);
}

function generateReferenceNumber(letter) {
  const type = (letter.type || 'surat').substring(0, 2).toUpperCase();
  const year = new Date().getFullYear();
  const suffix = Date.now().toString(36).toUpperCase().slice(-4);
  return `${type}/${year}/${suffix}`;
}

function rowToLetter(row, usersMap, idToNameMap = usersMap, approverMap = usersMap) {
  const createdBy = usersMap[row.createdBy] || null;
  if (!createdBy) return null;
  const approvalSteps = resolveApprovalSteps(safeJson(row.approvalSteps), approverMap);
  const statusHistory = resolveStatusHistory(safeJson(row.statusHistory), usersMap);
  const forwardedTo = resolveForwardedTo(safeJson(row.forwardedTo), usersMap);
  const cc = safeJson(row.cc);
  return {
    id: row.id,
    referenceNumber: row.referenceNumber || '',
    type: row.type || 'surat_masuk',
    subject: row.subject || '',
    content: row.content || '',
    status: row.status || 'draft',
    priority: row.priority || 'normal',
    classification: row.classification || 'internal',
    from: row.from || '',
    to: row.to || '',
    fromDepartment: row.fromDepartment || undefined,
    createdAt: row.createdAt || '',
    updatedAt: row.updatedAt || '',
    sentAt: row.sentAt || undefined,
    receivedAt: row.receivedAt || undefined,
    dueDate: row.dueDate || undefined,
    createdBy,
    attachments: safeJson(row.attachments),
    approvalSteps,
    statusHistory,
    signatures: safeJson(row.signatures),
    eventDate: row.eventDate || undefined,
    eventWaktu: row.eventWaktu || undefined,
    eventLocation: row.eventLocation || undefined,
    eventAcara: row.eventAcara || undefined,
    dispositionNote: row.dispositionNote || undefined,
    forwardedTo: forwardedTo.length ? forwardedTo : undefined,
    cc: cc,
    ccDisplay: resolveCcDisplay(cc, idToNameMap),
    contentJustification: row.contentJustification || 'left',
    lineHeight: row.lineHeight !== undefined && row.lineHeight !== '' ? parseFloat(row.lineHeight) : undefined,
    letterSpacing: row.letterSpacing || undefined,
    fontFamily: row.fontFamily || undefined,
    fontSize: row.fontSize !== undefined && row.fontSize !== '' ? parseFloat(row.fontSize) : undefined,
  };
}

/** Normalize approvalSteps so approverId is userId (not member id). Mutates letter.approvalSteps. */
async function normalizeApprovalStepsToUserId(letter) {
  const steps = letter.approvalSteps;
  if (!Array.isArray(steps) || steps.length === 0) return;
  const members = await membersService.getMembers().catch(() => []);
  const memberIdToUserId = {};
  members.forEach((m) => {
    const uid = (m.userId || '').trim();
    if (uid) memberIdToUserId[m.id] = uid;
  });
  steps.forEach((s) => {
    const approverId = memberIdToUserId[s.approverId] || s.approver?.id || s.approverId;
    s.approverId = approverId;
    s.approver = approverId ? { id: approverId } : undefined;
  });
}

function letterToRow(letter) {
  const approvalSteps = (letter.approvalSteps || []).map((s) => ({
    ...s,
    approverId: s.approver?.id,
    approver: undefined,
  }));
  const statusHistory = (letter.statusHistory || []).map((h) => ({
    ...h,
    changedById: h.changedBy?.id,
    changedBy: undefined,
  }));
  const forwardedTo = (letter.forwardedTo || []).map((u) => u?.id).filter(Boolean);
  return {
    id: letter.id,
    referenceNumber: letter.referenceNumber || '',
    type: letter.type || '',
    subject: letter.subject || '',
    content: letter.content || '',
    status: letter.status || '',
    priority: letter.priority || '',
    classification: letter.classification || '',
    from: letter.from || '',
    to: letter.to || '',
    fromDepartment: letter.fromDepartment || '',
    createdAt: letter.createdAt || '',
    updatedAt: letter.updatedAt || '',
    createdBy: letter.createdBy?.id || '',
    sentAt: letter.sentAt || '',
    receivedAt: letter.receivedAt || '',
    dueDate: letter.dueDate || '',
    eventDate: letter.eventDate || '',
    eventWaktu: letter.eventWaktu || '',
    eventLocation: letter.eventLocation || '',
    eventAcara: letter.eventAcara || '',
    dispositionNote: letter.dispositionNote || '',
    attachments: JSON.stringify(letter.attachments || []),
    approvalSteps: JSON.stringify(approvalSteps),
    statusHistory: JSON.stringify(statusHistory),
    cc: JSON.stringify(letter.cc || []),
    signatures: JSON.stringify(letter.signatures || []),
    forwardedTo: JSON.stringify(forwardedTo),
    contentJustification: letter.contentJustification || 'left',
    lineHeight: letter.lineHeight != null ? String(letter.lineHeight) : '',
    letterSpacing: letter.letterSpacing || '',
    fontFamily: letter.fontFamily || '',
    fontSize: letter.fontSize != null ? String(letter.fontSize) : '',
  };
}

export async function getLetters() {
  const client = await getSheetsClient();
  if (!client) return [];
  await ensureSheets(client);
  const usersMap = await getUsersMap();
  const members = await membersService.getMembers().catch(() => []);
  const idToNameMap = { ...usersMap };
  members.forEach((m) => { idToNameMap[m.id] = idToNameMap[m.id] || { name: m.name }; });
  const approverMap = { ...usersMap };
  members.forEach((m) => {
    const approverId = (m.userId || '').trim() || m.id;
    approverMap[m.id] = approverMap[m.id] || { id: approverId, name: m.name, email: m.email || '', role: m.role || '', department: m.department || '' };
  });
  const rows = await readAll(client, SHEETS_NAMES.LETTERS);
  const letters = [];
  for (const row of rows) {
    const letter = rowToLetter(row, usersMap, idToNameMap, approverMap);
    if (letter) letters.push(letter);
  }
  return letters;
}

export async function getLetterById(id) {
  const letters = await getLetters();
  return letters.find((l) => l.id === id) || null;
}

export async function createLetter(letter) {
  const client = await getSheetsClient();
  if (!client) throw new Error('Google Sheets not configured');
  await ensureSheets(client);
  await normalizeApprovalStepsToUserId(letter);
  const row = letterToRow(letter);
  await appendRow(client, SHEETS_NAMES.LETTERS, LETTER_HEADERS, row);
  return letter;
}

export async function updateLetter(id, updates) {
  const letters = await getLetters();
  const index = letters.findIndex((l) => l.id === id);
  if (index === -1) return null;
  const merged = { ...letters[index], ...updates, id, updatedAt: new Date().toISOString() };
  // Generate nomor surat only when status becomes approved (final approval)
  if (merged.status === 'approved' && (!merged.referenceNumber || !merged.referenceNumber.trim())) {
    merged.referenceNumber = generateReferenceNumber(merged);
  }
  // TODO: When status becomes 'approved', notify everyone in letter.cc (tembusan) — e.g. email or in-app notification
  await normalizeApprovalStepsToUserId(merged);
  const client = await getSheetsClient();
  if (!client) throw new Error('Google Sheets not configured');
  const row = letterToRow(merged);
  await updateRowByIndex(client, SHEETS_NAMES.LETTERS, index, LETTER_HEADERS, row);
  return merged;
}
