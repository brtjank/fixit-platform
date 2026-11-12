import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useIsAuthenticated } from '@/features/auth'
import { notificationsApi } from './api/notificationsApi'

export const notificationKeys = {
  all: ['notifications'] as const,
}

export function useNotifications() {
  const authed = useIsAuthenticated()
  return useQuery({ queryKey: notificationKeys.all, queryFn: notificationsApi.list, enabled: authed, refetchInterval: 60_000 })
}

export function useUnreadCount() {
  const { data } = useNotifications()
  return data?.filter((n) => !n.readAt).length ?? 0
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
