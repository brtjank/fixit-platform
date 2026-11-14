import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSessionStore } from '@/features/auth'
import { i18n } from '@/i18n'
import { errorMessage, isApiError } from '@/shared/api'
import { settingsApi, TenantErrorCodes, type NotificationPreferences, type UpdateTenantRequest } from '../api/settingsApi'

/** ✅ All settings hooks are backed by real endpoints. */
export const settingsKeys = {
  tenant: ['settings', 'tenant'] as const,
  notificationPreferences: ['settings', 'notification-preferences'] as const,
}

/** TEN_00x validation codes — the organization form shows them on the field, so no toast. */
const TENANT_FIELD_ERROR_CODES: ReadonlySet<string> = new Set(Object.values(TenantErrorCodes))

export function isTenantFieldError(error: unknown) {
  return isApiError(error) && TENANT_FIELD_ERROR_CODES.has(error.errorCode)
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
      toast.success(i18n.t('settings:toasts.organizationUpdated'))
    },
    onError: (e) => {
      if (!isTenantFieldError(e)) toast.error(errorMessage(e, i18n.t('settings:toasts.organizationFailed')))
    },
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
      toast.success(i18n.t('settings:toasts.preferencesSaved'))
    },
    onError: (e) => toast.error(errorMessage(e, i18n.t('settings:toasts.preferencesFailed'))),
  })
}
