import { http } from '@/shared/api'
import type { LoginRequest, LoginResponse, User } from '@/shared/types'

/** Profile of the signed-in user (`User` + `tenantName`). */
export interface MeResponse extends User {
  tenantName: string
}

export const authApi = {
  /**
   * ✅ POST /api/auth/login — real backend endpoint. Verifies the password (PBKDF2 hash); unknown, inactive or
   * wrong-password logins all get the same 401 AUTH_001_NOT_AUTHENTICATED. Demo accounts use DEMO_PASSWORD.
   */
  login: (body: LoginRequest) => http.post<LoginResponse>('/api/auth/login', body),

  /** ✅ GET /api/users/me — real backend endpoint (any role). */
  me: () => http.get<MeResponse>('/api/users/me'),
}
