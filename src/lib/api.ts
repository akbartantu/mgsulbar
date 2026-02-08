import type { User, Letter, DashboardStats } from '@/types/mail';

/** User with registration/approval fields (from GET /api/users, admin context) */
export type UserWithStatus = User & {
  status?: 'pending' | 'active' | 'rejected';
  approvedAt?: string;
  approvedById?: string;
};

const getBaseUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:3001';

let getToken: (() => string | null) | null = null;

export function setAuthTokenGetter(fn: () => string | null) {
  getToken = fn;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getBaseUrl();
  const url = path.startsWith('http') ? path : `${base}${path}`;
  const raw = getToken?.() ?? null;
  const token = typeof raw === 'string' ? raw.trim() : null;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers, credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function updateUserAdmin(
  id: string,
  updates: { status?: 'pending' | 'active' | 'rejected'; approvedAt?: string; approvedById?: string }
): Promise<UserWithStatus> {
  return request<UserWithStatus>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
}

export async function getMe(): Promise<User> {
  const base = getBaseUrl();
  const url = `${base}/api/me`;
  const raw = getToken?.() ?? null;
  const token = typeof raw === 'string' ? raw.trim() : null;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { headers, credentials: 'include' });
  const body = await res.json().catch(() => ({}));
  if (res.status === 403 && body.needRegister) {
    const e = new Error(body.error || 'Not registered') as Error & { needRegister?: boolean };
    e.needRegister = true;
    throw e;
  }
  if (!res.ok) {
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return body as User;
}

export async function updateMe(updates: { name?: string }): Promise<User> {
  return request<User>('/api/me', { method: 'PATCH', body: JSON.stringify(updates) });
}

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const base = getBaseUrl();
  const url = `${base}/api/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return body as { token: string; user: User };
}

export async function register(data: { name: string; email: string; password: string }): Promise<{ token?: string; user?: User; message?: string }> {
  const base = getBaseUrl();
  const url = `${base}/api/register`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return body as { token?: string; user?: User; message?: string };
}

export async function setup(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/api/setup');
}

export async function getTemplates(): Promise<{ id: string; name: string; kind: string; subjectTemplate: string; contentTemplate: string }[]> {
  return request('/api/templates');
}

export type Awardee = { id: string; name: string; university: string; major: string; year: number; status: string };
export type Program = { id: string; name: string; department?: string; status: string; progress: number; startDate: string; endDate: string; pic: string };
export type Member = { id: string; userId?: string; periodId?: string; name: string; role: string; department: string; email: string; status: string };
export type Transaction = { id: string; description: string; amount: number; date: string; category: string };
export type Period = { id: string; name: string; startDate: string; endDate: string; isActive: boolean };
export type Department = { id: string; name: string; periodId: string; sortOrder: number };

export async function getPeriods(): Promise<Period[]> {
  return request<Period[]>('/api/periods');
}

export async function createPeriod(data: { name?: string; startDate?: string; endDate?: string; isActive?: boolean }): Promise<Period> {
  return request<Period>('/api/periods', { method: 'POST', body: JSON.stringify(data) });
}

export async function updatePeriod(id: string, updates: { name?: string; startDate?: string; endDate?: string; isActive?: boolean }): Promise<Period> {
  return request<Period>(`/api/periods/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
}

export async function getDepartments(periodId?: string): Promise<Department[]> {
  const q = periodId ? `?periodId=${encodeURIComponent(periodId)}` : '';
  return request<Department[]>(`/api/departments${q}`);
}

export async function createDepartment(data: { name?: string; periodId?: string; sortOrder?: number }): Promise<Department> {
  return request<Department>('/api/departments', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateDepartment(id: string, updates: { name?: string; periodId?: string; sortOrder?: number }): Promise<Department> {
  return request<Department>(`/api/departments/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
}

export async function deleteDepartment(id: string): Promise<void> {
  await request(`/api/departments/${id}`, { method: 'DELETE' });
}

export async function getAwardees(): Promise<Awardee[]> {
  return request<Awardee[]>('/api/awardees');
}

export async function createAwardee(data: { name: string; university?: string; major?: string; year?: number; status?: string }): Promise<Awardee> {
  return request<Awardee>('/api/awardees', { method: 'POST', body: JSON.stringify(data) });
}

export async function getPrograms(): Promise<Program[]> {
  return request<Program[]>('/api/programs');
}

export async function createProgram(data: { name: string; department?: string; status?: string; progress?: number; startDate?: string; endDate?: string; pic?: string }): Promise<Program> {
  return request<Program>('/api/programs', { method: 'POST', body: JSON.stringify(data) });
}

export async function getMembers(params?: { periodId?: string }): Promise<Member[]> {
  const q = params?.periodId ? `?periodId=${encodeURIComponent(params.periodId)}` : '';
  return request<Member[]>(`/api/members${q}`);
}

export async function createMember(data: { userId?: string; periodId?: string; name: string; role?: string; department?: string; email?: string; status?: string }): Promise<Member> {
  return request<Member>('/api/members', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateMember(id: string, data: { userId?: string; periodId?: string; name?: string; role?: string; department?: string; email?: string; status?: string }): Promise<Member> {
  return request<Member>(`/api/members/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function getTransactions(): Promise<Transaction[]> {
  return request<Transaction[]>('/api/transactions');
}

export type NotificationsResponse = { returnedForRevision: Letter[]; approved: Letter[] };

export async function getNotifications(): Promise<NotificationsResponse> {
  return request<NotificationsResponse>('/api/notifications');
}

export async function createTransaction(data: { description: string; amount: number; date?: string; category?: string }): Promise<Transaction> {
  return request<Transaction>('/api/transactions', { method: 'POST', body: JSON.stringify(data) });
}

export const api = {
  getMe,
  updateMe,
  login,
  register,
  setup,
  getTemplates,
  getUsers: () => request<UserWithStatus[]>('/api/users'),
  updateUserAdmin,
  getLetters: () => request<Letter[]>('/api/letters'),
  getLetter: (id: string) => request<Letter>(`/api/letters/${id}`),
  createLetter: (letter: Partial<Letter>) =>
    request<Letter>('/api/letters', { method: 'POST', body: JSON.stringify(letter) }),
  updateLetter: (id: string, updates: Partial<Letter>) =>
    request<Letter>(`/api/letters/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  getDashboardStats: () => request<DashboardStats>('/api/dashboard/stats'),
  getAwardees,
  createAwardee,
  getPrograms,
  createProgram,
  getMembers,
  createMember,
  updateMember,
  getTransactions,
  createTransaction,
  getNotifications,
  getPeriods,
  createPeriod,
  updatePeriod,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};

export function getHealthUrl() {
  return `${getBaseUrl()}/api/health`;
}
