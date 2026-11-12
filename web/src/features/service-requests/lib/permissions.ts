import { useRole } from '@/features/auth'
import { i18n } from '@/i18n'
import { allowedTransitions, isClosedStatus } from '@/shared/lib'
import { ServiceRequestStatus, UserRole, type ServiceRequest } from '@/shared/types'

export interface RequestPermissions {
  /** Worker/Admin — customers can only view. */
  canManage: boolean
  canAssign: boolean
  assignReason: string | null
  canChangeStatus: boolean
  statusReason: string | null
  transitions: ServiceRequestStatus[]
}

/** Mirrors the backend policies (WorkerOrAdmin) and domain rules (see shared/lib/status.ts). */
export function getRequestPermissions(request: ServiceRequest, role: UserRole | null): RequestPermissions {
  const canManage = role === UserRole.Admin || role === UserRole.Worker
  const transitions = allowedTransitions(request.status, Boolean(request.assignedWorkerId))
  const closed = isClosedStatus(request.status)
  const immutableReason = () =>
    i18n.t(
      request.status === ServiceRequestStatus.Completed
        ? 'requests:permissions.immutable.completed'
        : request.status === ServiceRequestStatus.Cancelled
          ? 'requests:permissions.immutable.cancelled'
          : 'requests:permissions.immutable.other',
    )

  let assignReason: string | null = null
  if (!canManage) assignReason = i18n.t('requests:permissions.onlyStaffAssign')
  else if (request.status !== ServiceRequestStatus.Pending)
    assignReason = closed ? immutableReason() : i18n.t('requests:permissions.assignOnlyPending')

  let statusReason: string | null = null
  if (!canManage) statusReason = i18n.t('requests:permissions.onlyStaffStatus')
  else if (closed) statusReason = immutableReason()
  else if (transitions.length === 0) statusReason = i18n.t('requests:permissions.noTransitions')

  return {
    canManage,
    canAssign: assignReason === null,
    assignReason,
    canChangeStatus: statusReason === null,
    statusReason,
    transitions,
  }
}

export function useRequestPermissions(request: ServiceRequest | undefined) {
  const role = useRole()
  return request ? getRequestPermissions(request, role) : null
}
