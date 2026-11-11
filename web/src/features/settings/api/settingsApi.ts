import { http } from '@/shared/api'
import type { Tenant } from '@/shared/types'

/** ⚠ All settings endpoints are MOCK-ONLY (see docs/API_GAPS.md). */
export interface TenantSettings extends Tenant {
  contactEmail: string
  phone: string
  address: string
  timezone: string
  plan: 'starter' | 'team' | 'business'
}

export interface UpdateTenantRequest {
  name: string
  description: string | null
  contactEmail: string
  phone: string
  address: string
  timezone: string
}

export interface NotificationPreferences {
  emailOnNewRequest: boolean
  emailOnAssignment: boolean
  emailOnStatusChange: boolean
  dailyDigest: boolean
}

export const settingsApi = {
  tenant: () => http.get<TenantSettings>('/api/tenants/current'),
  updateTenant: (body: UpdateTenantRequest) => http.put<TenantSettings>('/api/tenants/current', body),
  notificationPreferences: () => http.get<NotificationPreferences>('/api/users/me/notification-preferences'),
  updateNotificationPreferences: (body: NotificationPreferences) =>
    http.put<NotificationPreferences>('/api/users/me/notification-preferences', body),
}
