import { http } from '@/shared/api'

/** ⚠ MOCK-ONLY (see docs/API_GAPS.md). */
export interface Notification {
  id: string
  title: string
  body: string
  serviceRequestId: string | null
  createdAt: string
  readAt: string | null
}

export const notificationsApi = {
  list: () => http.get<Notification[]>('/api/notifications'),
  markRead: (id: string) => http.put<Notification>(`/api/notifications/${id}/read`),
  markAllRead: () => http.put<{ updated: number }>('/api/notifications/read-all'),
}
