/**
 * Types mirroring the backend contracts (System.Text.Json, camelCase).
 * NOTE: the backend serializes enums as integers (no JsonStringEnumConverter),
 * so enum values are numeric here. LoginResponse.role is the exception (string).
 */

export const ServiceRequestStatus = {
  Pending: 1,
  Assigned: 2,
  InProgress: 3,
  Completed: 4,
  Cancelled: 5,
} as const
export type ServiceRequestStatus = (typeof ServiceRequestStatus)[keyof typeof ServiceRequestStatus]

export const UserRole = {
  Admin: 1,
  Worker: 2,
  Customer: 3,
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]
export type UserRoleName = keyof typeof UserRole

// ---- Entities (as returned by the API) ------------------------------------

export interface BaseEntity {
  id: string
  tenantId: string
  createdAt: string // ISO 8601 UTC
  isDeleted: boolean
}

export interface ServiceRequest extends BaseEntity {
  title: string
  description: string
  customerId: string
  assignedWorkerId: string | null
  status: ServiceRequestStatus
  notes: string | null
}

export interface User extends BaseEntity {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
}

/** Backend entity exists but has NO endpoint yet → served by mocks only. */
export interface WorkerProfile extends BaseEntity {
  userId: string
  specialization: string | null
  phoneNumber: string | null
  isAvailable: boolean
}

/** Backend entity exists but has NO endpoint yet → served by mocks only. */
export interface ServiceLog extends BaseEntity {
  serviceRequestId: string
  previousStatus: ServiceRequestStatus
  newStatus: ServiceRequestStatus
  notes: string | null
  changedByUserId: string | null
}

/** Backend entity exists but has NO endpoint yet → served by mocks only. */
export interface Tenant extends BaseEntity {
  name: string
  description: string | null
  isActive: boolean
}

// ---- Shared envelopes -------------------------------------------------------

export interface Paged<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}

export interface ApiErrorBody {
  errorCode: string
  message: string
  requestId: string | null
}

// ---- Auth -------------------------------------------------------------------

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  userId: string
  tenantId: string
  role: UserRoleName
}

// ---- Service requests -------------------------------------------------------

export interface ServiceRequestListParams {
  page?: number
  pageSize?: number
  status?: ServiceRequestStatus
  assignedWorkerId?: string
}

export interface CreateServiceRequestRequest {
  title: string
  description: string
  customerId: string
}

export interface CreateServiceRequestResponse {
  id: string
  title: string
  description: string
  customerId: string
  status: ServiceRequestStatus
  createdAt: string
}

export interface AssignWorkerRequest {
  serviceRequestId: string
  workerId: string
}

export interface AssignWorkerResponse {
  serviceRequestId: string
  assignedWorkerId: string | null
  status: ServiceRequestStatus
}

export interface ChangeServiceStatusRequest {
  serviceRequestId: string
  newStatus: ServiceRequestStatus
  notes?: string | null
}

export interface ChangeServiceStatusResponse {
  serviceRequestId: string
  status: ServiceRequestStatus
}

// ---- Users ------------------------------------------------------------------

export interface PagedParams {
  page?: number
  pageSize?: number
}
