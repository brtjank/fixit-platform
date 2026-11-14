import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { httpAuth } from '@/shared/api'
import { isTokenExpired } from '@/shared/lib'
import { UserRole, type UserRole as UserRoleValue, type UserRoleName } from '@/shared/types'

/** Session state persisted to localStorage. `profile` comes from GET /api/users/me. */
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
  /** Set when the server ended the session (401 on an authenticated request); shown once on /login. Not persisted. */
  sessionEnded: 'revoked' | 'expired' | null
  setSession: (session: Session) => void
  setProfile: (profile: SessionProfile) => void
  /** Explicit sign-out: clears the session without a notice. */
  clear: () => void
  endSession: (reason: 'revoked' | 'expired') => void
  dismissSessionEnded: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      profile: null,
      sessionEnded: null,
      setSession: (session) => set({ session, sessionEnded: null }),
      setProfile: (profile) => set({ profile }),
      clear: () => set({ session: null, profile: null }),
      endSession: (reason) => set({ session: null, profile: null, sessionEnded: reason }),
      dismissSessionEnded: () => set({ sessionEnded: null }),
    }),
    {
      name: 'fixit.session',
      partialize: ({ session, profile }) => ({ session, profile }),
    },
  ),
)

// Wire the http client to the store (avoids a circular import inside shared/api).
httpAuth.getToken = () => {
  const { session, endSession } = useSessionStore.getState()
  if (!session) return null
  if (isTokenExpired(session.token)) {
    endSession('expired')
    return null
  }
  return session.token
}
// A 401 without a session is a failed login (wrong password): no notice. With one, the session was ended server-side.
// A 401 for a token that has since been replaced (e.g. a request in flight during a password change) is ignored.
httpAuth.onUnauthorized = (errorCode, token) => {
  const { session, endSession } = useSessionStore.getState()
  if (session && session.token === token) endSession(errorCode === 'AUTH_003_SESSION_REVOKED' ? 'revoked' : 'expired')
}

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
