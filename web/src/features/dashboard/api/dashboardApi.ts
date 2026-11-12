import { http } from '@/shared/api'
import type { ServiceRequestStatus } from '@/shared/types'

/** ⚠ All dashboard endpoints are MOCK-ONLY (see docs/API_GAPS.md). */
export interface DashboardStats {
  openRequests: number
  pendingUnassigned: number
  inProgress: number
  completedLast30Days: number
  avgResolutionHours: number
  activeWorkers: number
  availableWorkers: number
  /** % change vs previous 30 days, e.g. 12.5 or -4 */
  trends: {
    openRequests: number
    completedLast30Days: number
    avgResolutionHours: number
  }
}

export interface StatusBreakdown {
  status: ServiceRequestStatus
  count: number
}

export interface DailyVolumePoint {
  date: string // yyyy-MM-dd
  created: number
  completed: number
}

export interface ActivityItem {
  id: string
  type: 'created' | 'assigned' | 'status_changed' | 'completed' | 'cancelled'
  serviceRequestId: string
  serviceRequestTitle: string
  actorName: string
  occurredAt: string
  detail?: string
}

export const dashboardApi = {
  stats: () => http.get<DashboardStats>('/api/dashboard/stats'),
  statusBreakdown: () => http.get<StatusBreakdown[]>('/api/dashboard/status-breakdown'),
  volume: (days = 30) => http.get<DailyVolumePoint[]>('/api/dashboard/volume', { query: { days } }),
  activity: (limit = 10) => http.get<ActivityItem[]>('/api/dashboard/activity', { query: { limit } }),
}
