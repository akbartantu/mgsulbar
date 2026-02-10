import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../middleware/auth.js';
import { getSheetsClient, ensureSheets, isSheetsRateLimitError } from '../sheets.js';
import * as lettersService from '../services/letters.js';
import * as usersService from '../services/users.js';
import * as dashboardService from '../services/dashboard.js';
import * as letterVisibility from '../services/letterVisibility.js';
import * as letterReadsService from '../services/letterReads.js';
import * as templatesService from '../services/templates.js';
import * as awardeesService from '../services/awardees.js';
import * as programsService from '../services/programs.js';
import * as membersService from '../services/members.js';
import * as transactionsService from '../services/transactions.js';
import * as periodsService from '../services/periods.js';
import * as departmentsService from '../services/departments.js';

const router = Router();

function getJwtSecret() {
  const raw = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  return typeof raw === 'string' ? raw.trim() : raw;
}

function signUserToken(payload) {
  return jwt.sign({ ...payload, source: 'password' }, getJwtSecret(), { expiresIn: '7d' });
}

function userToResponse(u) {
  return { id: u.id, email: u.email, name: u.name, role: u.role || 'viewer' };
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalized = (email || '').trim().toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword !== undefined && normalized === adminEmail.toLowerCase() && password === adminPassword) {
      const adminUser = { id: 'admin', email: adminEmail, name: 'Admin', role: 'admin' };
      const token = signUserToken(adminUser);
      return res.status(200).json({ token, user: userToResponse(adminUser) });
    }
    const userRow = await usersService.getUserWithPasswordByEmail(normalized);
    if (!userRow) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!userRow.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const status = userRow.status || 'active';
    if (status !== 'active') {
      return res.status(403).json({
        error: status === 'pending'
          ? 'Akun menunggu persetujuan admin. Silakan coba lagi setelah disetujui.'
          : 'Akun tidak dapat masuk.',
      });
    }
    const match = await bcrypt.compare(password, userRow.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const userPayload = { id: userRow.id, email: userRow.email, name: userRow.name, role: userRow.role || 'viewer' };
    const token = signUserToken(userPayload);
    return res.status(200).json({ token, user: userToResponse(userPayload) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    const normalized = (email || '').trim().toLowerCase();
    const existing = await usersService.getUserByEmail(normalized);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const id = 'u' + Date.now();
    await usersService.createUser({
      id,
      name: (name || '').trim(),
      email: normalized,
      role: 'viewer',
      passwordHash,
      status: 'pending',
    });
    return res.status(201).json({
      message: 'Pendaftaran berhasil. Anda dapat masuk setelah disetujui oleh admin.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

router.use(authMiddleware);

router.get('/setup', async (_req, res) => {
  try {
    const client = await getSheetsClient();
    if (!client) return res.status(503).json({ error: 'Google Sheets not configured' });
    await ensureSheets(client);
    return res.json({ ok: true, message: 'Sheets ensured' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Setup failed' });
  }
});

router.get('/templates', async (_req, res) => {
  try {
    const templates = await templatesService.getTemplates();
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const profile = req.user;
    if (profile.source === 'password') {
      const user = { id: profile.id, email: profile.email, name: profile.name, role: profile.role };
      return res.json(user);
    }
    const sheetUser = await usersService.getUserByEmail(profile.email);
    if (!sheetUser) {
      return res.status(403).json({ error: 'Not registered', needRegister: true });
    }
    res.json(sheetUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

router.patch('/me', async (req, res) => {
  try {
    const { id } = req.user;
    const updated = await usersService.updateUserById(id, req.body);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/users', async (_req, res) => {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const users = await usersService.getUsers();
      return res.json(users);
    } catch (err) {
      if (isSheetsRateLimitError(err)) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 2500));
          continue;
        }
        console.warn('Sheets rate limit (429) on GET /users');
        return res.status(503).json({ error: 'Quota Google Sheets terlampaui. Coba lagi dalam satu menit.' });
      }
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    const updates = req.body;
    if (updates.status === 'active') {
      updates.approvedAt = updates.approvedAt || new Date().toISOString();
      updates.approvedById = updates.approvedById || req.user.id;
    }
    const updated = await usersService.updateUserByIdAdmin(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.get('/periods', async (_req, res) => {
  try {
    const periods = await periodsService.getPeriods();
    res.json(periods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch periods' });
  }
});

router.post('/periods', async (req, res) => {
  try {
    const created = await periodsService.createPeriod(req.body);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create period' });
  }
});

router.patch('/periods/:id', async (req, res) => {
  try {
    const updated = await periodsService.updatePeriod(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Period not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update period' });
  }
});

router.get('/departments', async (req, res) => {
  const periodId = req.query.periodId;
  const fetch = () => periodId
    ? departmentsService.getDepartments(periodId)
    : departmentsService.getDepartmentsForCurrentPeriod();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const list = await fetch();
      return res.json(list);
    } catch (err) {
      if (isSheetsRateLimitError(err)) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 2500));
          continue;
        }
        console.warn('Sheets rate limit (429) on GET /departments');
        return res.status(503).json({ error: 'Quota Google Sheets terlampaui. Coba lagi dalam satu menit.' });
      }
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch departments' });
    }
  }
});

router.post('/departments', async (req, res) => {
  try {
    const created = await departmentsService.createDepartment(req.body);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

router.patch('/departments/:id', async (req, res) => {
  try {
    const updated = await departmentsService.updateDepartment(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Department not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    const deleted = await departmentsService.deleteDepartment(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Department not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

router.get('/dashboard/stats', authMiddleware, async (req, res) => {
  const log = (msg, data) => fetch('http://127.0.0.1:7246/ingest/55bae2bf-7bcd-493f-9377-31aad3707983',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:GET /dashboard/stats',message:msg,data:data||{},timestamp:Date.now()})}).catch(()=>{});
  try {
    const userId = req.user?.id;
    log('dashboard/stats entry', { userId: userId ? 'set' : 'missing' });
    const stats = await dashboardService.getDashboardStats(userId);
    log('dashboard/stats success', { outbox: stats?.outbox, drafts: stats?.drafts });
    res.json(stats);
  } catch (err) {
    log('dashboard/stats error', { errMessage: err?.message, errName: err?.name });
    console.error(err);
    if (isSheetsRateLimitError(err)) {
      return res.status(503).json({ error: 'Quota Google Sheets terlampaui. Coba lagi dalam satu menit.' });
    }
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

/** In-app notifications derived from letters: creator sees returned/approved; approvers see count via dashboard stats */
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.json({ returnedForRevision: [], approved: [] });
    const letters = await lettersService.getLetters();
    const returnedForRevision = letters
      .filter((l) => l.createdBy?.id === userId && l.status === 'revision')
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 20);
    const approved = letters
      .filter((l) => l.createdBy?.id === userId && l.status === 'approved')
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 20);
    res.json({ returnedForRevision, approved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/** Resolve sheet user id and role from req.user (for role-based letter visibility). */
async function resolveSheetUser(req) {
  const u = req.user;
  if (!u) return { userId: null, role: 'viewer' };
  if (u.role) return { userId: u.id, role: u.role };
  const sheetUser = await usersService.getUserByEmail(u.email).catch(() => null);
  if (sheetUser) return { userId: sheetUser.id, role: sheetUser.role || 'viewer' };
  return { userId: u.id, role: 'viewer' };
}

router.get('/letters', async (req, res) => {
  const log = (msg, data) => fetch('http://127.0.0.1:7246/ingest/55bae2bf-7bcd-493f-9377-31aad3707983',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:GET /letters',message:msg,data:data||{},timestamp:Date.now()})}).catch(()=>{});
  try {
    log('letters entry', {});
    const letters = await lettersService.getLetters();
    log('letters getLetters done', { count: letters?.length });
    const { userId, role } = await resolveSheetUser(req);
    log('letters resolveSheetUser done', { role });
    if (role === 'admin') return res.json(letters);
    const members = await membersService.getMembersForCurrentPeriod().catch(() => []);
    const filtered = letters.filter((l) =>
      letterVisibility.isLetterVisibleToUser(l, userId, role, members)
    );
    log('letters success', { filteredCount: filtered?.length });
    res.json(filtered);
  } catch (err) {
    log('letters error', { errMessage: err?.message, errName: err?.name });
    console.error(err);
    if (isSheetsRateLimitError(err)) {
      return res.status(503).json({ error: 'Quota Google Sheets terlampaui. Coba lagi dalam satu menit.' });
    }
    res.status(500).json({ error: 'Failed to fetch letters' });
  }
});

router.get('/letters/:id', async (req, res) => {
  try {
    const letter = await lettersService.getLetterById(req.params.id);
    if (!letter) return res.status(404).json({ error: 'Letter not found' });
    const { userId, role } = await resolveSheetUser(req);
    if (role === 'admin') return res.json(letter);
    const members = await membersService.getMembersForCurrentPeriod().catch(() => []);
    const visible = letterVisibility.isLetterVisibleToUser(letter, userId, role, members);
    if (!visible) return res.status(404).json({ error: 'Letter not found' });
    res.json(letter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch letter' });
  }
});

router.post('/letters/:id/read', async (req, res) => {
  const log = (msg, data) => fetch('http://127.0.0.1:7246/ingest/55bae2bf-7bcd-493f-9377-31aad3707983',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:POST /letters/:id/read',message:msg,data:data||{},timestamp:Date.now()})}).catch(()=>{});
  try {
    const userId = req.user?.id;
    if (!userId) {
      log('read endpoint 401', {});
      return res.status(401).json({ error: 'Authorization required' });
    }
    const letterId = req.params.id;
    log('read endpoint called', { userId, letterId });
    await letterReadsService.markAsRead(userId, letterId);
    log('read endpoint success', { userId, letterId });
    return res.status(204).send();
  } catch (err) {
    log('read endpoint error', { errMessage: err?.message });
    console.error(err);
    return res.status(500).json({ error: 'Failed to mark letter as read' });
  }
});

router.post('/letters', async (req, res) => {
  try {
    const body = req.body;
    const id = body.id || `L${Date.now()}`;
    const now = new Date().toISOString();
    const letter = {
      ...body,
      id,
      createdAt: body.createdAt || now,
      updatedAt: now,
      attachments: body.attachments || [],
      approvalSteps: body.approvalSteps || [],
      statusHistory: body.statusHistory || [],
    };
    await lettersService.createLetter(letter);
    res.status(201).json(letter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create letter' });
  }
});

router.patch('/letters/:id', async (req, res) => {
  try {
    const body = req.body;
    if (body.status === 'pending_approval' && req.user) {
      const existing = await lettersService.getLetterById(req.params.id);
      if (existing && existing.status !== 'pending_approval') {
        const now = new Date().toISOString();
        const newEntry = {
          status: 'pending_approval',
          changedBy: { id: req.user.id, name: req.user.name || req.user.email || '—' },
          changedAt: now,
        };
        body.statusHistory = [...(existing.statusHistory || []), newEntry];
      }
    }
    const updated = await lettersService.updateLetter(req.params.id, body);
    if (!updated) return res.status(404).json({ error: 'Letter not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update letter' });
  }
});

router.get('/awardees', async (_req, res) => {
  try {
    const list = await awardeesService.getAwardees();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch awardees' });
  }
});

router.post('/awardees', async (req, res) => {
  try {
    const { name, university, major, year, status } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const list = await awardeesService.getAwardees();
    const maxId = list.length ? Math.max(...list.map((a) => Number(a.id) || 0)) : 0;
    const id = String(maxId + 1);
    const created = await awardeesService.createAwardee({
      id,
      name: (name || '').trim(),
      university: (university || '').trim() || '-',
      major: (major || '').trim() || '-',
      year: year != null && year !== '' ? Number(year) : new Date().getFullYear(),
      status: status || 'Aktif',
    });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create awardee' });
  }
});

router.get('/programs', async (_req, res) => {
  try {
    const list = await programsService.getPrograms();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

router.post('/programs', async (req, res) => {
  try {
    const { name, status, progress, startDate, endDate, pic } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const list = await programsService.getPrograms();
    const maxId = list.length ? Math.max(...list.map((p) => Number(p.id) || 0)) : 0;
    const id = String(maxId + 1);
    const prog = Number(progress);
    const created = await programsService.createProgram({
      id,
      name: (name || '').trim(),
      status: status || 'Berjalan',
      progress: Number.isNaN(prog) ? 0 : Math.min(100, Math.max(0, prog)),
      startDate: (startDate || '').trim() || '-',
      endDate: (endDate || '').trim() || '-',
      pic: (pic || '').trim() || '-',
    });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create program' });
  }
});

router.get('/members', async (req, res) => {
  const periodId = req.query.periodId;
  const fetch = () => periodId === 'current'
    ? membersService.getMembersForCurrentPeriod()
    : membersService.getMembers(periodId || undefined);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const list = await fetch();
      return res.json(list);
    } catch (err) {
      if (isSheetsRateLimitError(err)) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 2500));
          continue;
        }
        console.warn('Sheets rate limit (429) on GET /members');
        return res.status(503).json({ error: 'Quota Google Sheets terlampaui. Coba lagi dalam satu menit.' });
      }
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch members' });
    }
  }
});

router.post('/members', async (req, res) => {
  const { userId, periodId, name, role, department, email, status } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const list = await membersService.getMembers();
      const maxId = list.length ? Math.max(...list.map((m) => Number(m.id) || 0)) : 0;
      const id = String(maxId + 1);
      let resolvedPeriodId = (periodId || '').trim();
      if (!resolvedPeriodId) {
        const active = await periodsService.getActivePeriod();
        resolvedPeriodId = active ? active.id : '';
      }
      const created = await membersService.createMember({
        id,
        userId: (userId || '').trim(),
        periodId: resolvedPeriodId,
        name: (name || '').trim(),
        role: (role || '').trim() || 'Anggota',
        department: (department || '').trim() || '-',
        email: (email || '').trim() || '-',
        status: status || 'Aktif',
      });
      return res.status(201).json(created);
    } catch (err) {
      if (isSheetsRateLimitError(err)) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 2500));
          continue;
        }
        console.warn('Sheets rate limit (429) on POST /members');
        return res.status(503).json({ error: 'Quota Google Sheets terlampaui. Coba lagi dalam satu menit.' });
      }
      console.error(err);
      const statusCode = err.message && err.message.includes('Hanya pengguna') ? 400 : 500;
      return res.status(statusCode).json({ error: err.message || 'Failed to create member' });
    }
  }
});

router.patch('/members/:id', async (req, res) => {
  try {
    const updated = await membersService.updateMemberById(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Member not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

router.get('/transactions', async (_req, res) => {
  try {
    const list = await transactionsService.getTransactions();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.post('/transactions', async (req, res) => {
  try {
    const { description, amount, date, category } = req.body;
    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }
    const list = await transactionsService.getTransactions();
    const maxId = list.length ? Math.max(...list.map((t) => Number(t.id) || 0)) : 0;
    const id = String(maxId + 1);
    const amt = Number(amount);
    const created = await transactionsService.createTransaction({
      id,
      description: (description || '').trim(),
      amount: Number.isNaN(amt) ? 0 : amt,
      date: (date || '').trim() || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      category: (category || '').trim() || '-',
    });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

export default router;
