import { http } from '@/shared/api'
import type { Tenant } from '@/shared/types'

/** Backend limits for PUT /api/tenants/current (longer → 400 with the matching TEN_00x code). */
export const TENANT_NAME_MAX_LENGTH = 200
export const TENANT_DESCRIPTION_MAX_LENGTH = 1000
export const TENANT_CONTACT_EMAIL_MAX_LENGTH = 256
export const TENANT_PHONE_MAX_LENGTH = 30
export const TENANT_ADDRESS_MAX_LENGTH = 300

/** Error codes of PUT /api/tenants/current; the organization form maps them onto fields. */
export const TenantErrorCodes = {
  NameRequired: 'TEN_001_NAME_REQUIRED',
  NameTooLong: 'TEN_003_NAME_TOO_LONG',
  ContactEmailInvalid: 'TEN_004_CONTACT_EMAIL_INVALID',
  PhoneTooLong: 'TEN_005_PHONE_TOO_LONG',
  AddressTooLong: 'TEN_006_ADDRESS_TOO_LONG',
  TimezoneInvalid: 'TEN_007_TIMEZONE_INVALID',
  DescriptionTooLong: 'TEN_008_DESCRIPTION_TOO_LONG',
} as const

export type TenantPlan = 'starter' | 'team' | 'business'

/** ✅ GET /api/tenants/current — the Tenant entity plus the settings columns. */
export interface TenantSettings extends Tenant {
  contactEmail: string | null
  phone: string | null
  address: string | null
  /** IANA id, e.g. `Europe/Warsaw`. */
  timezone: string
  /** Read-only (not part of the PUT body). */
  plan: TenantPlan
}

/** ✅ Body of PUT /api/tenants/current — full replacement; strings trimmed, empty → null (nullable ones). */
export interface UpdateTenantRequest {
  name: string
  description: string | null
  contactEmail: string | null
  phone: string | null
  address: string | null
  timezone: string
}

/** ✅ The caller's own e-mail preferences (stored only — nothing sends e-mail yet). */
export interface NotificationPreferences {
  emailOnNewRequest: boolean
  emailOnAssignment: boolean
  emailOnStatusChange: boolean
  dailyDigest: boolean
}

/** Returned by GET when the user has never saved preferences. */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailOnNewRequest: true,
  emailOnAssignment: true,
  emailOnStatusChange: true,
  dailyDigest: false,
}

/**
 * Settings API.
 * ✅ = real backend endpoint   ⚠ = MOCK-ONLY (see docs/API_GAPS.md)
 */
export const settingsApi = {
  /** ✅ GET /api/tenants/current  (any role) */
  tenant: () => http.get<TenantSettings>('/api/tenants/current'),
  /** ✅ PUT /api/tenants/current  (policy: AdminOnly) — `plan` is read-only. 400 TEN_001/003–008. */
  updateTenant: (body: UpdateTenantRequest) => http.put<TenantSettings>('/api/tenants/current', body),
  /** ✅ GET /api/users/me/notification-preferences  (any role; defaults when never saved) */
  notificationPreferences: () => http.get<NotificationPreferences>('/api/users/me/notification-preferences'),
  /** ✅ PUT /api/users/me/notification-preferences  (any role) — full replacement of all four bools, upsert. */
  updateNotificationPreferences: (body: NotificationPreferences) =>
    http.put<NotificationPreferences>('/api/users/me/notification-preferences', body),
}
