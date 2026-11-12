import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLogout, useMe, useProfile, useSession } from '@/features/auth'
import { fullName } from '@/shared/lib'
import { Avatar, Button, Card, CardContent, RoleBadge, Separator, Skeleton } from '@/shared/ui'
import { CopyButton } from './CopyButton'
import { Row, SectionHeading } from './SectionCard'

function Mono({ value }: { value: string }) {
  const { t } = useTranslation('settings')
  return (
    <span className="flex items-center gap-1">
      <code className="truncate font-mono text-xs text-fg-muted">{value}</code>
      <CopyButton value={value} label={t('copy.label')} iconOnly />
    </span>
  )
}

export function ProfileSection() {
  const { t } = useTranslation('settings')
  const session = useSession()
  const profile = useProfile()
  const me = useMe()
  const logout = useLogout()

  const user = me.data ?? (profile ? { ...profile } : null)
  if (!session) return null

  return (
    <section>
      <SectionHeading title={t('profile.title')} description={t('profile.description')} mock />
      <Card>
        <CardContent>
          {me.isLoading && !user ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="flex items-center gap-4">
              <Avatar user={user} size="lg" className="!size-16 !text-lg" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-fg">{fullName(user)}</p>
                <p className="truncate text-sm text-fg-muted">{user?.email ?? '—'}</p>
                <div className="mt-1.5">
                  <RoleBadge role={session.role} />
                </div>
              </div>
            </div>
          )}
          <Separator className="my-4" />
          <dl className="divide-y divide-border">
            <Row label={t('profile.organization')}>{user?.tenantName ?? '—'}</Row>
            <Row label={t('profile.userId')}>
              <Mono value={session.userId} />
            </Row>
            <Row label={t('profile.tenantId')}>
              <Mono value={session.tenantId} />
            </Row>
          </dl>
          <p className="mt-3 text-xs text-fg-subtle">{t('profile.editingUnavailable')}</p>
          <Separator className="my-4" />
          <Button variant="secondary" onClick={logout}>
            <LogOut /> {t('profile.signOut')}
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
