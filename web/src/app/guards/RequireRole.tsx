import { ShieldAlert } from 'lucide-react'
import { Outlet } from 'react-router'
import { useRole } from '@/features/auth'
import type { UserRole } from '@/shared/types'
import { EmptyState } from '@/shared/ui'

/** Route-level role gate. Renders a friendly 403 instead of redirecting (mirrors API policies). */
export function RequireRole({ roles }: { roles: UserRole[] }) {
  const role = useRole()
  if (role === null || !roles.includes(role)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="You don't have access to this page"
        description="This area is restricted to other roles in your organization."
        className="mt-10"
      />
    )
  }
  return <Outlet />
}
