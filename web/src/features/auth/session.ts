import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { httpAuth } from '@/shared/api'
import { isTokenExpired } from '@/shared/lib'
import { UserRole, type UserRole as UserRoleValue, type UserRoleName } from '@/shared/types'

/** Session state persisted to localStorage. `profile` comes from the (mock-only) /api/users/me endpoint. */
export interface Session {
  token: string
  userId: string
  tenantId: string
  role: UserRoleValue
  roleName: UserRoleName
}

export interface SessionProfile {
  firstName: string
  lastName: string
  email: string
  tenantName: string
}

interface SessionState {
  session: Session | null
  profile: SessionProfile | null
  setSession: (session: Session) => void
  setProfile: (profile: SessionProfile) => void
  clear: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      profile: null,
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      clear: () => set({ session: null, profile: null }),
    }),
    { name: 'fixit.session' },
  ),
)

// Wire the http client to the store (avoids a circular import inside shared/api).
httpAuth.getToken = () => {
  const { session, clear } = useSessionStore.getState()
  if (!session) return null
  if (isTokenExpired(session.token)) {
    clear()
    return null
  }
  return session.token
}
httpAuth.onUnauthorized = () => useSessionStore.getState().clear()

// ---- Convenience selectors ---------------------------------------------------

export const useSession = () => useSessionStore((s) => s.session)
export const useProfile = () => useSessionStore((s) => s.profile)
export const useIsAuthenticated = () => useSessionStore((s) => s.session !== null)

export function useRole(): UserRoleValue | null {
  return useSessionStore((s) => s.session?.role ?? null)
}

export function useHasRole(...roles: UserRoleValue[]) {
  const role = useRole()
  return role !== null && roles.includes(role)
}

export const useIsAdmin = () => useHasRole(UserRole.Admin)
export const useIsWorker = () => useHasRole(UserRole.Worker)
export const useIsCustomer = () => useHasRole(UserRole.Customer)
