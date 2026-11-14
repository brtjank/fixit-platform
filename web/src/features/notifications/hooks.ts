import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useIsAuthenticated } from '@/features/auth'
import { i18n } from '@/i18n'
import { errorMessage } from '@/shared/api'
import { notificationsApi, type NotificationListParams } from './api/notificationsApi'

/** How often the bell badge (and an open notifications page) re-polls the backend. */
export const NOTIFICATIONS_POLL_MS = 30_000

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params: NotificationListParams) => [...notificationKeys.lists(), params] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

/** ✅ GET /api/notifications — polled while mounted, refetched on window focus. */
export function useNotifications(params: NotificationListParams = {}) {
  const authed = useIsAuthenticated()
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationsApi.list(params),
    enabled: authed,
    refetchInterval: NOTIFICATIONS_POLL_MS,
    refetchOnWindowFocus: true,
  })
}

/** ✅ GET /api/notifications/unread-count — drives the top-bar bell badge (30 s polling + on focus). */
export function useUnreadCount() {
  const authed = useIsAuthenticated()
  const { data } = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationsApi.unreadCount,
    enabled: authed,
    refetchInterval: NOTIFICATIONS_POLL_MS,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
  return data?.count ?? 0
}

/** ✅ PUT /api/notifications/{id}/read — refreshes the lists and the badge. */
export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
    onError: (e) => toast.error(errorMessage(e, i18n.t('notifications:toasts.markReadError'))),
  })
}

/** ✅ PUT /api/notifications/read-all */
export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
    onError: (e) => toast.error(errorMessage(e, i18n.t('notifications:toasts.markAllReadError'))),
  })
}
