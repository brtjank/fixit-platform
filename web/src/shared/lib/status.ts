import { i18n } from '@/i18n'
import { ServiceRequestStatus, UserRole, type UserRoleName } from '@/shared/types'

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'violet' | 'brand'

export interface StatusMeta {
  value: ServiceRequestStatus
  key: keyof typeof ServiceRequestStatus
  /** English fallback — prefer statusLabel() / statusDescription() which are translated. */
  label: string
  tone: Tone
  description: string
  /** i18n key suffix under common:status.* */
  i18nKey: 'pending' | 'assigned' | 'inProgress' | 'completed' | 'cancelled'
}

export const STATUS_META: Record<ServiceRequestStatus, StatusMeta> = {
  [ServiceRequestStatus.Pending]: {
    value: ServiceRequestStatus.Pending,
    key: 'Pending',
    i18nKey: 'pending',
    label: 'Pending',
    tone: 'warning',
    description: 'Waiting for a worker to be assigned',
  },
  [ServiceRequestStatus.Assigned]: {
    value: ServiceRequestStatus.Assigned,
    key: 'Assigned',
    i18nKey: 'assigned',
    label: 'Assigned',
    tone: 'info',
    description: 'A worker has been assigned, work not started',
  },
  [ServiceRequestStatus.InProgress]: {
    value: ServiceRequestStatus.InProgress,
    key: 'InProgress',
    i18nKey: 'inProgress',
    label: 'In progress',
    tone: 'violet',
    description: 'Work is underway',
  },
  [ServiceRequestStatus.Completed]: {
    value: ServiceRequestStatus.Completed,
    key: 'Completed',
    i18nKey: 'completed',
    label: 'Completed',
    tone: 'success',
    description: 'Work finished — this request is closed',
  },
  [ServiceRequestStatus.Cancelled]: {
    value: ServiceRequestStatus.Cancelled,
    key: 'Cancelled',
    i18nKey: 'cancelled',
    label: 'Cancelled',
    tone: 'neutral',
    description: 'Request was cancelled — this request is closed',
  },
}

export const ALL_STATUSES: ServiceRequestStatus[] = [
  ServiceRequestStatus.Pending,
  ServiceRequestStatus.Assigned,
  ServiceRequestStatus.InProgress,
  ServiceRequestStatus.Completed,
  ServiceRequestStatus.Cancelled,
]

export const OPEN_STATUSES: ServiceRequestStatus[] = [
  ServiceRequestStatus.Pending,
  ServiceRequestStatus.Assigned,
  ServiceRequestStatus.InProgress,
]

/** Translated status label (re-renders with the app language because the tree is keyed by language). */
export function statusLabel(status: ServiceRequestStatus) {
  const meta = STATUS_META[status]
  return meta ? i18n.t(`common:status.${meta.i18nKey}`) : i18n.t('common:status.unknown', { value: status })
}

export function statusDescription(status: ServiceRequestStatus) {
  const meta = STATUS_META[status]
  return meta ? i18n.t(`common:status.description.${meta.i18nKey}`) : ''
}

export function isClosedStatus(status: ServiceRequestStatus) {
  return status === ServiceRequestStatus.Completed || status === ServiceRequestStatus.Cancelled
}

/** Parse "Pending" | "pending" | "1" | 1 → ServiceRequestStatus (undefined if invalid). */
export function parseStatus(value: string | number | null | undefined): ServiceRequestStatus | undefined {
  if (value === null || value === undefined || value === '') return undefined
  if (typeof value === 'number') return ALL_STATUSES.includes(value as ServiceRequestStatus) ? (value as ServiceRequestStatus) : undefined
  const asNumber = Number(value)
  if (!Number.isNaN(asNumber)) return parseStatus(asNumber)
  const hit = Object.values(STATUS_META).find((m) => m.key.toLowerCase() === value.toLowerCase())
  return hit?.value
}

/**
 * Transitions allowed by the domain (ServiceRequest.ChangeStatus / AssignWorker):
 *  - Completed / Cancelled are immutable
 *  - InProgress requires an assigned worker
 *  - Assignment is only possible while Pending (and sets Assigned)
 */
export function allowedTransitions(
  status: ServiceRequestStatus,
  hasWorker: boolean,
): ServiceRequestStatus[] {
  if (isClosedStatus(status)) return []
  const next: ServiceRequestStatus[] = []
  if (hasWorker && status !== ServiceRequestStatus.InProgress) next.push(ServiceRequestStatus.InProgress)
  next.push(ServiceRequestStatus.Completed, ServiceRequestStatus.Cancelled)
  return next
}

// ---- Roles ------------------------------------------------------------------

export const ROLE_META: Record<UserRole, { label: string; tone: Tone; name: UserRoleName; i18nKey: 'admin' | 'worker' | 'customer' }> = {
  [UserRole.Admin]: { label: 'Admin', tone: 'brand', name: 'Admin', i18nKey: 'admin' },
  [UserRole.Worker]: { label: 'Worker', tone: 'info', name: 'Worker', i18nKey: 'worker' },
  [UserRole.Customer]: { label: 'Customer', tone: 'neutral', name: 'Customer', i18nKey: 'customer' },
}

/** Translated role label — prefer this over ROLE_META[role].label. */
export function roleLabel(role: UserRole) {
  const meta = ROLE_META[role]
  return meta ? i18n.t(`common:role.${meta.i18nKey}`) : i18n.t('common:role.unknown', { value: role })
}

export function parseRole(value: string | number | null | undefined): UserRole | undefined {
  if (value === null || value === undefined || value === '') return undefined
  if (typeof value === 'number') return (Object.values(UserRole) as number[]).includes(value) ? (value as UserRole) : undefined
  const asNumber = Number(value)
  if (!Number.isNaN(asNumber)) return parseRole(asNumber)
  const key = (Object.keys(UserRole) as UserRoleName[]).find((k) => k.toLowerCase() === value.toLowerCase())
  return key ? UserRole[key] : undefined
}
