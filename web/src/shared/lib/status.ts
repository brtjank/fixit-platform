import { ServiceRequestStatus, UserRole, type UserRoleName } from '@/shared/types'

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'violet' | 'brand'

export interface StatusMeta {
  value: ServiceRequestStatus
  key: keyof typeof ServiceRequestStatus
  label: string
  tone: Tone
  description: string
}

export const STATUS_META: Record<ServiceRequestStatus, StatusMeta> = {
  [ServiceRequestStatus.Pending]: {
    value: ServiceRequestStatus.Pending,
    key: 'Pending',
    label: 'Pending',
    tone: 'warning',
    description: 'Waiting for a worker to be assigned',
  },
  [ServiceRequestStatus.Assigned]: {
    value: ServiceRequestStatus.Assigned,
    key: 'Assigned',
    label: 'Assigned',
    tone: 'info',
    description: 'A worker has been assigned, work not started',
  },
  [ServiceRequestStatus.InProgress]: {
    value: ServiceRequestStatus.InProgress,
    key: 'InProgress',
    label: 'In progress',
    tone: 'violet',
    description: 'Work is underway',
  },
  [ServiceRequestStatus.Completed]: {
    value: ServiceRequestStatus.Completed,
    key: 'Completed',
    label: 'Completed',
    tone: 'success',
    description: 'Work finished — this request is closed',
  },
  [ServiceRequestStatus.Cancelled]: {
    value: ServiceRequestStatus.Cancelled,
    key: 'Cancelled',
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

export function statusLabel(status: ServiceRequestStatus) {
  return STATUS_META[status]?.label ?? `Status ${status}`
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

export const ROLE_META: Record<UserRole, { label: string; tone: Tone; name: UserRoleName }> = {
  [UserRole.Admin]: { label: 'Admin', tone: 'brand', name: 'Admin' },
  [UserRole.Worker]: { label: 'Worker', tone: 'info', name: 'Worker' },
  [UserRole.Customer]: { label: 'Customer', tone: 'neutral', name: 'Customer' },
}

export function roleLabel(role: UserRole) {
  return ROLE_META[role]?.label ?? `Role ${role}`
}

export function parseRole(value: string | number | null | undefined): UserRole | undefined {
  if (value === null || value === undefined || value === '') return undefined
  if (typeof value === 'number') return (Object.values(UserRole) as number[]).includes(value) ? (value as UserRole) : undefined
  const asNumber = Number(value)
  if (!Number.isNaN(asNumber)) return parseRole(asNumber)
  const key = (Object.keys(UserRole) as UserRoleName[]).find((k) => k.toLowerCase() === value.toLowerCase())
  return key ? UserRole[key] : undefined
}
