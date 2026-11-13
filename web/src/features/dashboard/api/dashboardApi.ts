import { http } from '@/shared/api'
import type { ServiceRequestStatus } from '@/shared/types'

/**
 * ✅ Dashboard endpoints (policy: WorkerOrAdmin, tenant-wide).
 * "open" = Pending | Assigned | InProgress. A request's completedAt = createdAt of its latest ServiceLog
 * with newStatus Completed. Windows: last 30 days = (now-30d, now], previous = (now-60d, now-30d].
 */
export interface DashboardStats {
  openRequests: number
  pendingUnassigned: number
  inProgress: number
  completedLast30Days: number
  avgResolutionHours: number
  activeWorkers: number
  availableWorkers: number
  /**
   * % change (1 decimal) vs the previous 30 days, e.g. 12.5 or -4. prev = 0 → 0 when cur = 0, else 100.
   */
  trends: {
    /** NOT the open backlog: requests CREATED in the last 30 days vs the previous 30. */
    openRequests: number
    /** Completed (by completedAt) last 30 vs previous 30. */
    completedLast30Days: number
    /** Avg resolution last 30 vs previous 30; 0 when the previous window has no completions. */
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
  /** Log notes, else "<Prev> → <New>" (enum names); null/omitted for `created`. */
  detail?: string | null
}

export const dashboardApi = {
  /** ✅ GET /api/dashboard/stats */
  stats: () => http.get<DashboardStats>('/api/dashboard/stats'),
  /** ✅ GET /api/dashboard/status-breakdown — exactly five rows, statuses 1..5, zero-filled */
  statusBreakdown: () => http.get<StatusBreakdown[]>('/api/dashboard/status-breakdown'),
  /** ✅ GET /api/dashboard/volume?days — days clamped to [7, 90]; exactly `days` UTC points, oldest first, last = today */
  volume: (days = 30) => http.get<DailyVolumePoint[]>('/api/dashboard/volume', { query: { days } }),
  /** ✅ GET /api/dashboard/activity?limit — limit clamped to [1, 50]; newest first */
  activity: (limit = 10) => http.get<ActivityItem[]>('/api/dashboard/activity', { query: { limit } }),
}
