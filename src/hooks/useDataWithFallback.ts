import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Letter, DashboardStats } from '@/types/mail';
import { mockLetters, dashboardStats as mockDashboardStats } from '@/data/mockData';

/**
 * Fetch letters from API; use mock data when API fails or returns empty (e.g. Google Sheet not configured).
 */
export function useLetters(): { letters: Letter[]; loading: boolean; refetch: () => void } {
  const [letters, setLetters] = useState<Letter[]>(mockLetters);
  const [loading, setLoading] = useState(true);

  const fetchLetters = useCallback(() => {
    setLoading(true);
    api
      .getLetters()
      .then((data) => {
        setLetters(Array.isArray(data) && data.length > 0 ? data : mockLetters);
      })
      .catch(() => {
        setLetters(mockLetters);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLetters();
  }, [fetchLetters]);

  return { letters, loading, refetch: fetchLetters };
}

/**
 * Fetch dashboard stats from API; use mock data when API fails (e.g. Google Sheet empty/not configured).
 */
export function useDashboardStats(): { stats: DashboardStats; loading: boolean; refetch: () => void } {
  const [stats, setStats] = useState<DashboardStats>(mockDashboardStats);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(() => {
    setLoading(true);
    api
      .getDashboardStats()
      .then((data) => {
        const merged: DashboardStats = {
          inbox: data?.inbox ?? mockDashboardStats.inbox,
          outbox: data?.outbox ?? mockDashboardStats.outbox,
          drafts: data?.drafts ?? mockDashboardStats.drafts,
          pendingApproval: data?.pendingApproval ?? mockDashboardStats.pendingApproval,
          awaitingMyApproval: data?.awaitingMyApproval ?? mockDashboardStats.awaitingMyApproval,
        };
        setStats(merged);
      })
      .catch(() => {
        setStats(mockDashboardStats);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
