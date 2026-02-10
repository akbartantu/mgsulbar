import { createContext, useContext } from 'react';

type DashboardStatsContextValue = {
  refetchDashboardStats?: () => void;
};

const DashboardStatsContext = createContext<DashboardStatsContextValue>({});

export function useDashboardStatsRefetch(): (() => void) | undefined {
  return useContext(DashboardStatsContext).refetchDashboardStats;
}

export const DashboardStatsProvider = DashboardStatsContext.Provider;
