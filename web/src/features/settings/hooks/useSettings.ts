import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSessionStore } from '@/features/auth'
import { errorMessage } from '@/shared/api'
import { settingsApi, type NotificationPreferences, type UpdateTenantRequest } from '../api/settingsApi'

/** ⚠ All settings hooks are backed by MOCK-ONLY endpoints. */
export const settingsKeys = {
  tenant: ['settings', 'tenant'] as const,
  notificationPreferences: ['settings', 'notification-preferences'] as const,
}

export const useTenant = () => useQuery({ queryKey: settingsKeys.tenant, queryFn: settingsApi.tenant })

export function useUpdateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateTenantRequest) => settingsApi.updateTenant(body),
    onSuccess: (tenant) => {
      void qc.invalidateQueries({ queryKey: settingsKeys.tenant })
      const { profile, setProfile } = useSessionStore.getState()
      if (profile) setProfile({ ...profile, tenantName: tenant.name })
      toast.success('Organization updated')
    },
    onError: (e) => toast.error(errorMessage(e, 'Could not save organization settings')),
  })
}

export const useNotificationPreferences = () =>
  useQuery({ queryKey: settingsKeys.notificationPreferences, queryFn: settingsApi.notificationPreferences })

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: NotificationPreferences) => settingsApi.updateNotificationPreferences(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: settingsKeys.notificationPreferences })
      toast.success('Preferences saved')
    },
    onError: (e) => toast.error(errorMessage(e, 'Could not save preferences')),
  })
}
