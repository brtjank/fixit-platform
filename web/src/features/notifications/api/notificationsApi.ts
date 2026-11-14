import { http } from '@/shared/api'
import type { ServiceRequestStatus } from '@/shared/types'

/** The only type the backend emits today (consumer of the `ServiceRequestStatusChanged` domain event). */
export const NotificationType = {
  ServiceRequestStatusChanged: 'ServiceRequestStatusChanged',
} as const
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

/**
 * NotificationDto. Title/body text is NOT stored on the backend — the UI renders translated copy
 * from `type` + statuses (see NotificationItem). `type` is typed as string so unknown future types
 * still render (generic fallback).
 */
export interface Notification {
  id: string
  type: NotificationType | (string & {})
  serviceRequestId: string | null
  serviceRequestTitle: string | null
  previousStatus: ServiceRequestStatus | null
  newStatus: ServiceRequestStatus | null
  /** "First Last"; null when the change was made by the system or the actor was deleted. */
  actorName: string | null
  createdAt: string
  readAt: string | null
}

export interface NotificationListParams {
  unreadOnly?: boolean
  /** 1..100, backend default 20. */
  limit?: number
}

export const NOTIFICATIONS_MAX_LIMIT = 100

/**
 * In-app notifications — always the caller's own (tenant + recipient scoped; a foreign id → 404).
 * ✅ = real backend endpoint
 */
export const notificationsApi = {
  /** ✅ GET /api/notifications?unreadOnly=&limit=  (any role) — newest first */
  list: ({ unreadOnly = false, limit = 20 }: NotificationListParams = {}) =>
    http.get<Notification[]>('/api/notifications', { query: { unreadOnly, limit } }),
  /** ✅ GET /api/notifications/unread-count  (any role) */
  unreadCount: () => http.get<{ count: number }>('/api/notifications/unread-count'),
  /** ✅ PUT /api/notifications/{id}/read  (any role, idempotent) */
  markRead: (id: string) => http.put<Notification>(`/api/notifications/${id}/read`),
  /** ✅ PUT /api/notifications/read-all  (any role) */
  markAllRead: () => http.put<{ updated: number }>('/api/notifications/read-all'),
}
