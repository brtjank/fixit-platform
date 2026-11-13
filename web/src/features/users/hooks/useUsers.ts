import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { useRole } from '@/features/auth'
import { i18n } from '@/i18n'
import { errorMessage } from '@/shared/api'
import { fullName, shortId } from '@/shared/lib'
import { UserRole, type PagedParams, type User } from '@/shared/types'
import { usersApi, type InviteUserRequest, type UpdateUserRequest } from '../api/usersApi'

export const userKeys = {
  all: ['users'] as const,
  list: (params: PagedParams) => [...userKeys.all, 'list', params] as const,
  workers: (params: PagedParams) => [...userKeys.all, 'workers', params] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
  directory: () => [...userKeys.all, 'directory'] as const,
}

/** ✅ GET /api/users (AdminOnly) */
export function useUsers(params: PagedParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })
}

/** ✅ GET /api/users/workers (WorkerOrAdmin) */
export function useWorkers(params: PagedParams = { page: 1, pageSize: 100 }, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.workers(params),
    queryFn: () => usersApi.workers(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })
}

/** ✅ GET /api/users/{id} — any role, tenant-scoped */
export function useUser(id: string | undefined) {
  return useQuery({ queryKey: userKeys.detail(id ?? ''), queryFn: () => usersApi.getById(id!), enabled: Boolean(id) })
}

/**
 * Directory of users for resolving ids → names in lists/details.
 * - Admin: GET /api/users (everyone)
 * - Worker: GET /api/users/workers (only colleagues; customers resolve to a short id)
 * - Customer: nothing (no endpoint allows it) → ids render as short references
 */
export function useUserDirectory() {
  const role = useRole()
  const isAdmin = role === UserRole.Admin
  const isWorker = role === UserRole.Worker

  const usersQuery = useQuery({
    queryKey: [...userKeys.directory(), 'all'],
    queryFn: () => usersApi.list({ page: 1, pageSize: 100 }),
    enabled: isAdmin,
    staleTime: 5 * 60_000,
  })
  const workersQuery = useQuery({
    queryKey: [...userKeys.directory(), 'workers'],
    queryFn: () => usersApi.workers({ page: 1, pageSize: 100 }),
    enabled: isWorker,
    staleTime: 5 * 60_000,
  })

  const byId = useMemo(() => {
    const map = new Map<string, User>()
    for (const u of usersQuery.data?.items ?? []) map.set(u.id, u)
    for (const u of workersQuery.data?.items ?? []) map.set(u.id, u)
    return map
  }, [usersQuery.data, workersQuery.data])

  return {
    isLoading: usersQuery.isLoading || workersQuery.isLoading,
    byId,
    getUser: (id: string | null | undefined) => (id ? byId.get(id) ?? null : null),
    /** Display name, or a short reference like "USR-3F9A2C" when unknown. */
    label: (id: string | null | undefined, fallbackPrefix = 'USR') => {
      if (!id) return '—'
      const u = byId.get(id)
      return u ? fullName(u) : shortId(id, fallbackPrefix)
    },
    workers: [...byId.values()].filter((u) => u.role === UserRole.Worker),
    customers: [...byId.values()].filter((u) => u.role === UserRole.Customer),
  }
}

function useInvalidateUsers() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: userKeys.all })
    void qc.invalidateQueries({ queryKey: ['workers'] })
  }
}

/** ⚠ mock-only */
export function useInviteUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: (body: InviteUserRequest) => usersApi.invite(body),
    onSuccess: (u) => {
      invalidate()
      toast.success(i18n.t('users:toasts.invited', { email: u.email }))
    },
    onError: (e) => toast.error(errorMessage(e, i18n.t('users:toasts.inviteError'))),
  })
}

/** ⚠ mock-only */
export function useUpdateUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserRequest }) => usersApi.update(id, body),
    onSuccess: () => {
      invalidate()
      toast.success(i18n.t('users:toasts.updated'))
    },
    onError: (e) => toast.error(errorMessage(e, i18n.t('users:toasts.updateError'))),
  })
}

/** ⚠ mock-only */
export function useSetUserActive() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => (active ? usersApi.activate(id) : usersApi.deactivate(id)),
    onSuccess: (u) => {
      invalidate()
      toast.success(u.isActive ? i18n.t('users:toasts.activated') : i18n.t('users:toasts.deactivated'))
    },
    onError: (e) => toast.error(errorMessage(e, i18n.t('users:toasts.updateError'))),
  })
}
