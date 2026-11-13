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

/** ✅ GET /api/workers/profiles, GET/PUT /api/workers/{userId}/profile. Limits: specialization ≤ 200, phoneNumber ≤ 20. */
export interface WorkerProfile extends BaseEntity {
  userId: string
  specialization: string | null
  phoneNumber: string | null
  isAvailable: boolean
}

/** Status history entry — ✅ GET /api/service-requests/{id}/logs. */
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
  customerId?: string
  /** Case-insensitive substring on title OR description (server-side, before totalCount). Max 200 chars. */
  search?: string
  /** `field:dir`; omitted → backend default `createdAt:desc` (tie-break id). */
  sort?: ServiceRequestSort
}

export const SERVICE_REQUEST_SORT_FIELDS = ['createdAt', 'title', 'status'] as const
export type ServiceRequestSortField = (typeof SERVICE_REQUEST_SORT_FIELDS)[number]
export type SortDirection = 'asc' | 'desc'
export type ServiceRequestSort = `${ServiceRequestSortField}:${SortDirection}`
export const DEFAULT_SERVICE_REQUEST_SORT: ServiceRequestSort = 'createdAt:desc'
/** Backend limit for `?search=` (longer → 400 SR_006_SEARCH_TOO_LONG). */
export const SERVICE_REQUEST_SEARCH_MAX_LENGTH = 200

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
