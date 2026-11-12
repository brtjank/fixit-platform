import { http } from '@/shared/api'
import type { Paged, PagedParams, User, UserRole } from '@/shared/types'

/** ⚠ MOCK-ONLY payloads — backend has no user management endpoints yet. */
export interface InviteUserRequest {
  email: string
  firstName: string
  lastName: string
  role: UserRole
}
export interface UpdateUserRequest {
  firstName: string
  lastName: string
  role: UserRole
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

  /** ⚠ GET /api/users/{id} — MOCK-ONLY */
  getById: (id: string) => http.get<User>(`/api/users/${id}`),

  /** ⚠ POST /api/users — MOCK-ONLY (invite / create user) */
  invite: (body: InviteUserRequest) => http.post<User>('/api/users', body),

  /** ⚠ PUT /api/users/{id} — MOCK-ONLY */
  update: (id: string, body: UpdateUserRequest) => http.put<User>(`/api/users/${id}`, body),

  /** ⚠ PUT /api/users/{id}/deactivate | activate — MOCK-ONLY */
  deactivate: (id: string) => http.put<User>(`/api/users/${id}/deactivate`),
  activate: (id: string) => http.put<User>(`/api/users/${id}/activate`),
}
