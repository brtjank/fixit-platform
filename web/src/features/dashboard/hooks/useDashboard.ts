import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboardApi'

/** ⚠ All dashboard hooks are backed by MOCK-ONLY endpoints. */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  breakdown: () => [...dashboardKeys.all, 'status-breakdown'] as const,
  volume: (days: number) => [...dashboardKeys.all, 'volume', days] as const,
  activity: (limit: number) => [...dashboardKeys.all, 'activity', limit] as const,
}

export const useDashboardStats = () => useQuery({ queryKey: dashboardKeys.stats(), queryFn: dashboardApi.stats })
export const useStatusBreakdown = () => useQuery({ queryKey: dashboardKeys.breakdown(), queryFn: dashboardApi.statusBreakdown })
export const useVolume = (days = 30) => useQuery({ queryKey: dashboardKeys.volume(days), queryFn: () => dashboardApi.volume(days) })
export const useActivity = (limit = 10) => useQuery({ queryKey: dashboardKeys.activity(limit), queryFn: () => dashboardApi.activity(limit) })
