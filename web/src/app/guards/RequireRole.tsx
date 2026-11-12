import { ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import { useRole } from '@/features/auth'
import type { UserRole } from '@/shared/types'
import { EmptyState } from '@/shared/ui'

/** Route-level role gate. Renders a friendly 403 instead of redirecting (mirrors API policies). */
export function RequireRole({ roles }: { roles: UserRole[] }) {
  const role = useRole()
  const { t } = useTranslation()
  if (role === null || !roles.includes(role)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={t('errors.forbiddenTitle')}
        description={t('errors.forbiddenDescription')}
        className="mt-10"
      />
    )
  }
  return <Outlet />
}
