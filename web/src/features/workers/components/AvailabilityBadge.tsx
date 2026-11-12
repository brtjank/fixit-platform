import { useTranslation } from 'react-i18next'
import type { User, WorkerProfile } from '@/shared/types'
import { Badge } from '@/shared/ui'

/** Inactive → neutral; available → success; otherwise warning. Missing profile renders nothing. */
export function AvailabilityBadge({ user, profile, className }: { user: User; profile: WorkerProfile | null; className?: string }) {
  const { t } = useTranslation('workers')
  if (!user.isActive)
    return (
      <Badge tone="neutral" dot className={className}>
        {t('availability.inactive')}
      </Badge>
    )
  if (!profile) return null
  return profile.isAvailable ? (
    <Badge tone="success" dot className={className}>
      {t('availability.available')}
    </Badge>
  ) : (
    <Badge tone="warning" dot className={className}>
      {t('availability.unavailable')}
    </Badge>
  )
}
