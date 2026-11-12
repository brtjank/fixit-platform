import { Mail, Phone, Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { cn, fullName } from '@/shared/lib'
import { Avatar, Card, Skeleton } from '@/shared/ui'
import type { WorkerRosterEntry } from '../hooks'
import { AvailabilityBadge } from './AvailabilityBadge'
import { WorkloadNumbers } from './WorkloadNumbers'

export function WorkerCard({ entry, extrasLoading }: { entry: WorkerRosterEntry; extrasLoading?: boolean }) {
  const { t } = useTranslation('workers')
  const { user, profile, workload } = entry
  return (
    <Link
      to={`/workers/${user.id}`}
      className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={t('card.open', { name: fullName(user) })}
    >
      <Card className={cn('h-full p-5 transition-colors group-hover:border-border-strong group-hover:bg-surface-hover', !user.isActive && 'opacity-75')}>
        <div className="flex items-start gap-3">
          <Avatar user={user} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-sm font-semibold text-fg">{fullName(user)}</h3>
              {extrasLoading ? <Skeleton className="h-5 w-16 rounded-full" /> : <AvailabilityBadge user={user} profile={profile} />}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-fg-muted">
              <Mail className="size-3.5 shrink-0 text-fg-subtle" />
              <span className="truncate">{user.email}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-1.5 text-sm">
          {extrasLoading ? (
            <>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </>
          ) : profile ? (
            <>
              <p className="flex items-center gap-2 text-fg">
                <Wrench className="size-3.5 shrink-0 text-fg-subtle" />
                <span className="truncate">{profile.specialization ?? <span className="text-fg-subtle">{t('card.noSpecialization')}</span>}</span>
              </p>
              <p className="flex items-center gap-2 text-fg-muted">
                <Phone className="size-3.5 shrink-0 text-fg-subtle" />
                {profile.phoneNumber ? <span className="font-mono text-xs">{profile.phoneNumber}</span> : <span className="text-fg-subtle">{t('card.noPhone')}</span>}
              </p>
            </>
          ) : (
            <p className="text-sm italic text-fg-subtle">{t('card.noProfile')}</p>
          )}
        </div>

        <WorkloadNumbers workload={workload} className="mt-4" />
      </Card>
    </Link>
  )
}

export function WorkerCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="mt-4 h-14 w-full" />
    </Card>
  )
}
