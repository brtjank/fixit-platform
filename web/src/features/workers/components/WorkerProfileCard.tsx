import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/shared/lib'
import type { User, WorkerProfile } from '@/shared/types'
import { Card, CardContent, CardHeader, MockBadge, Skeleton } from '@/shared/ui'

export function WorkerProfileCard({ user, profile, loading }: { user: User; profile: WorkerProfile | null; loading?: boolean }) {
  const { t } = useTranslation('workers')
  const value = (v: ReactNode) => (loading ? <Skeleton className="h-4 w-28" /> : v)
  const missing = <span className="text-fg-subtle">{t('detail.profile.notSet')}</span>
  return (
    <Card>
      <CardHeader title={<span className="inline-flex items-center gap-2">{t('detail.profile.title')} <MockBadge /></span>} />
      <CardContent>
        {!loading && !profile ? <p className="mb-3 text-sm italic text-fg-subtle">{t('detail.profile.noProfile')}</p> : null}
        <dl className="space-y-3 text-sm">
          <Row label={t('detail.profile.specialization')}>{value(profile?.specialization ?? missing)}</Row>
          <Row label={t('detail.profile.phone')}>{value(profile?.phoneNumber ? <span className="font-mono text-xs">{profile.phoneNumber}</span> : missing)}</Row>
          <Row label={t('detail.profile.memberSince')}>{formatDate(user.createdAt)}</Row>
          <Row label={t('detail.profile.userId')}>
            <span className="break-all font-mono text-xs text-fg-muted">{user.id}</span>
          </Row>
        </dl>
      </CardContent>
    </Card>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-fg-subtle">{label}</dt>
      <dd className="text-fg">{children}</dd>
    </div>
  )
}
