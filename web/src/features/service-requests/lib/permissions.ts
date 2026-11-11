import { useRole } from '@/features/auth'
import { allowedTransitions, isClosedStatus, STATUS_META } from '@/shared/lib'
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
  const label = STATUS_META[request.status]?.label ?? 'Closed'

  let assignReason: string | null = null
  if (!canManage) assignReason = 'Only workers and admins can assign requests'
  else if (request.status !== ServiceRequestStatus.Pending)
    assignReason = closed ? `${label} requests are immutable` : 'A worker can only be assigned while the request is Pending'

  let statusReason: string | null = null
  if (!canManage) statusReason = 'Only workers and admins can change the status'
  else if (closed) statusReason = `${label} requests are immutable`
  else if (transitions.length === 0) statusReason = 'No status changes are available'

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
