import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Letter, DashboardStats } from '@/types/mail';

const emptyStats: DashboardStats = {
  inbox: 0,
  outbox: 0,
  drafts: 0,
  pendingApproval: 0,
  awaitingMyApproval: 0,
};

/**
 * Fetch letters from API (Google Sheets). Returns empty array when API fails or returns no data.
 */
export function useLetters(): { letters: Letter[]; loading: boolean; refetch: () => void } {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLetters = useCallback(() => {
    setLoading(true);
    api
      .getLetters()
      .then((data) => {
        setLetters(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setLetters([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLetters();
  }, [fetchLetters]);

  return { letters, loading, refetch: fetchLetters };
}

/**
 * Fetch dashboard stats from API (Google Sheets). Returns zeros when API fails or returns no data.
 */
export function useDashboardStats(): { stats: DashboardStats; loading: boolean; refetch: () => void } {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(() => {
    setLoading(true);
    api
      .getDashboardStats()
      .then((data) => {
        setStats({
          inbox: data?.inbox ?? 0,
          outbox: data?.outbox ?? 0,
          drafts: data?.drafts ?? 0,
          pendingApproval: data?.pendingApproval ?? 0,
          awaitingMyApproval: data?.awaitingMyApproval ?? 0,
        });
      })
      .catch(() => {
        setStats(emptyStats);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

export interface DashboardSummary {
  awardeeCount: number;
  programCount: number;
  memberCount: number;
  totalSaldo: number;
  awardeeAktifCount: number;
  programBerjalanCount: number;
}

/**
 * Fetch awardees, programs, members, transactions from API for dashboard counts and finance sum.
 * On failure or empty response for a resource, uses 0 for that metric.
 */
export function useDashboardSummary(): {
  summary: DashboardSummary;
  loading: boolean;
  refetch: () => void;
} {
  const [summary, setSummary] = useState<DashboardSummary>({
    awardeeCount: 0,
    programCount: 0,
    memberCount: 0,
    totalSaldo: 0,
    awardeeAktifCount: 0,
    programBerjalanCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(() => {
    setLoading(true);
    Promise.allSettled([
      api.getAwardees(),
      api.getPrograms(),
      api.getMembers({ periodId: 'current' }),
      api.getTransactions(),
    ])
      .then(([awardeesRes, programsRes, membersRes, transactionsRes]) => {
        const awardees = awardeesRes.status === 'fulfilled' && Array.isArray(awardeesRes.value) ? awardeesRes.value : [];
        const programs = programsRes.status === 'fulfilled' && Array.isArray(programsRes.value) ? programsRes.value : [];
        const members = membersRes.status === 'fulfilled' && Array.isArray(membersRes.value) ? membersRes.value : [];
        const transactions = transactionsRes.status === 'fulfilled' && Array.isArray(transactionsRes.value) ? transactionsRes.value : [];
        const totalSaldo = transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0);
        setSummary({
          awardeeCount: awardees.length,
          programCount: programs.length,
          memberCount: members.length,
          totalSaldo,
          awardeeAktifCount: awardees.filter((a) => (a.status || '').toString() === 'Aktif').length,
          programBerjalanCount: programs.filter((p) => (p.status || '').toString() === 'Berjalan').length,
        });
      })
      .catch(() => {
        setSummary({
          awardeeCount: 0,
          programCount: 0,
          memberCount: 0,
          totalSaldo: 0,
          awardeeAktifCount: 0,
          programBerjalanCount: 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, refetch: fetchSummary };
}
