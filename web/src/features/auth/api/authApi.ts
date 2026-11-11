import { http } from '@/shared/api'
import type { LoginRequest, LoginResponse, User } from '@/shared/types'

/** Profile of the signed-in user. ⚠ MOCK-ONLY endpoint — backend has no /me yet (see docs/API_GAPS.md). */
export interface MeResponse extends User {
  tenantName: string
}

export const authApi = {
  /** POST /api/auth/login — real backend endpoint. Note: backend currently does not verify passwords. */
  login: (body: LoginRequest) => http.post<LoginResponse>('/api/auth/login', body),

  /** GET /api/users/me — MOCK-ONLY. */
  me: () => http.get<MeResponse>('/api/users/me'),
}
