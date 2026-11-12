import { Navigate, Outlet, useLocation } from 'react-router'
import { useIsAuthenticated } from '@/features/auth'

export function RequireAuth() {
  const authed = useIsAuthenticated()
  const location = useLocation()
  if (!authed) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}

/** Signed-in users never see auth pages; they go back to where they came from (deep link) or home. */
export function RedirectIfAuthed() {
  const authed = useIsAuthenticated()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  if (authed) return <Navigate to={from && from.startsWith('/') && from !== '/login' ? from : '/'} replace />
  return <Outlet />
}
