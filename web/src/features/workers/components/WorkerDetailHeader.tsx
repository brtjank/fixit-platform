import { Mail, Pencil, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fullName } from '@/shared/lib'
import type { User, WorkerProfile } from '@/shared/types'
import { Avatar, Button, Card, RoleBadge, Skeleton } from '@/shared/ui'
import { AvailabilityBadge } from './AvailabilityBadge'

interface WorkerDetailHeaderProps {
  user: User
  profile: WorkerProfile | null
  profileLoading?: boolean
  canEdit: boolean
  onEdit: () => void
}

export function WorkerDetailHeader({ user, profile, profileLoading, canEdit, onEdit }: WorkerDetailHeaderProps) {
  const { t } = useTranslation('workers')
  return (
    <Card className="mb-6 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar user={user} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight text-fg">{fullName(user)}</h1>
            <RoleBadge role={user.role} />
            {profileLoading ? <Skeleton className="h-5 w-20 rounded-full" /> : <AvailabilityBadge user={user} profile={profile} />}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
            <a href={`mailto:${user.email}`} className="inline-flex items-center gap-1.5 hover:text-fg">
              <Mail className="size-3.5 text-fg-subtle" />
              {user.email}
            </a>
            {profile?.phoneNumber ? (
              <a href={`tel:${profile.phoneNumber.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-fg">
                <Phone className="size-3.5 text-fg-subtle" />
                <span className="font-mono text-xs">{profile.phoneNumber}</span>
              </a>
            ) : null}
            {profile?.specialization ? <span>{profile.specialization}</span> : null}
          </div>
        </div>
        {canEdit ? (
          <Button variant="secondary" onClick={onEdit} disabled={profileLoading}>
            <Pencil /> {t('detail.editProfile')}
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
