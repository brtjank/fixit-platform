import { http } from '@/shared/api'
import type { Paged, PagedParams, User, UserRole } from '@/shared/types'

/** Password policy shared by every endpoint that sets a password (else 400 USR_007_PASSWORD_TOO_WEAK). */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

/** Error codes the user forms map onto fields instead of a banner. */
export const UserErrorCodes = {
  EmailTaken: 'USR_005_EMAIL_TAKEN',
  SelfDeactivate: 'USR_006_SELF_DEACTIVATE',
  PasswordTooWeak: 'USR_007_PASSWORD_TOO_WEAK',
  PasswordMismatch: 'USR_008_PASSWORD_MISMATCH',
  SelfRoleChange: 'USR_009_SELF_ROLE_CHANGE',
} as const

/** ✅ POST /api/users body. `role` is sent as the number. */
export interface InviteUserRequest {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  /** Temporary password, 8–128 characters. */
  password: string
}
/** ✅ PUT /api/users/{id} body — full replacement of these three. */
export interface UpdateUserRequest {
  firstName: string
  lastName: string
  role: UserRole
}
/** ✅ PUT /api/users/me/password body. */
export interface ChangeOwnPasswordRequest {
  currentPassword: string
  newPassword: string
}
/** ✅ PUT /api/users/{id}/password body (admin reset). */
export interface ResetUserPasswordRequest {
  newPassword: string
}

/**
 * Users API.
 * ✅ = real backend endpoint   ⚠ = MOCK-ONLY (see docs/API_GAPS.md)
 */
export const usersApi = {
  /** ✅ GET /api/users?page&pageSize  (policy: AdminOnly) */
  list: (params: PagedParams = {}) =>
    http.get<Paged<User>>('/api/users', {
      query: { page: params.page ?? 1, pageSize: params.pageSize ?? 20 },
    }),

  /** ✅ GET /api/users/workers?page&pageSize  (policy: WorkerOrAdmin) */
  workers: (params: PagedParams = {}) =>
    http.get<Paged<User>>('/api/users/workers', {
      query: { page: params.page ?? 1, pageSize: params.pageSize ?? 20 },
    }),

  /** ✅ GET /api/users/{id}  (any role, tenant-scoped; 404 RES_001_NOT_FOUND otherwise) */
  getById: (id: string) => http.get<User>(`/api/users/${id}`),

  /**
   * ✅ POST /api/users  (AdminOnly) → 201 `User`. Workers also get an empty WorkerProfile.
   * 400: USR_001/002/004 (domain), USR_005_EMAIL_TAKEN (global, case-insensitive), USR_007_PASSWORD_TOO_WEAK.
   */
  invite: (body: InviteUserRequest) => http.post<User>('/api/users', body),

  /** ✅ PUT /api/users/{id}  (AdminOnly) → 200 `User`. 400 USR_009_SELF_ROLE_CHANGE; other tenant → 404. */
  update: (id: string, body: UpdateUserRequest) => http.put<User>(`/api/users/${id}`, body),

  /** ✅ PUT /api/users/{id}/deactivate | activate  (AdminOnly, idempotent) → 200 `User`. 400 USR_006 / USR_003. */
  deactivate: (id: string) => http.put<User>(`/api/users/${id}/deactivate`),
  activate: (id: string) => http.put<User>(`/api/users/${id}/activate`),

  /** ✅ PUT /api/users/me/password  (any role) → 204. 400 USR_008_PASSWORD_MISMATCH / USR_007_PASSWORD_TOO_WEAK. */
  changeOwnPassword: (body: ChangeOwnPasswordRequest) => http.put<void>('/api/users/me/password', body),

  /** ✅ PUT /api/users/{id}/password  (AdminOnly) → 204. 400 USR_007; other tenant → 404. */
  resetPassword: (id: string, body: ResetUserPasswordRequest) => http.put<void>(`/api/users/${id}/password`, body),
}
