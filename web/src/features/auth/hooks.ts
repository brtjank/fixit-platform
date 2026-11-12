import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { i18n } from '@/i18n'
import { queryClient } from '@/shared/api/queryClient'
import { parseRole } from '@/shared/lib'
import { UserRole, type LoginRequest } from '@/shared/types'
import { authApi } from './api/authApi'
import { useSessionStore } from './session'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

export function useLogin() {
  const setSession = useSessionStore((s) => s.setSession)
  const setProfile = useSessionStore((s) => s.setProfile)

  return useMutation({
    mutationFn: async (body: LoginRequest) => {
      const res = await authApi.login(body)
      const role = parseRole(res.role) ?? UserRole.Customer
      setSession({ token: res.token, userId: res.userId, tenantId: res.tenantId, role, roleName: res.role })
      // Profile (✅ GET /api/users/me) is best-effort. Never block login on it.
      try {
        const me = await authApi.me()
        setProfile({ firstName: me.firstName, lastName: me.lastName, email: me.email, tenantName: me.tenantName })
      } catch {
        setProfile({ firstName: body.email.split('@')[0] ?? i18n.t('auth:profile.fallbackName'), lastName: '', email: body.email, tenantName: 'FixIt' })
      }
      return res
    },
  })
}

export function useLogout() {
  const clear = useSessionStore((s) => s.clear)
  const navigate = useNavigate()
  return () => {
    clear()
    queryClient.clear()
    navigate('/login', { replace: true })
  }
}

export function useMe() {
  const session = useSessionStore((s) => s.session)
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    enabled: session !== null,
    staleTime: 5 * 60_000,
  })
}
