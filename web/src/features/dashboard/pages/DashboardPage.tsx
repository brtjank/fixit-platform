import { CheckCircle2, Clock, Hourglass, Inbox, Plus, Users, Wrench } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useIsAdmin } from '@/features/auth'
import { errorMessage } from '@/shared/api'
import { formatDate } from '@/shared/lib'
import { Button, Card, ErrorState, MockBadge, PageHeader } from '@/shared/ui'
import { ActivityFeed } from '../components/ActivityFeed'
import { NeedsAttentionList } from '../components/NeedsAttentionList'
import { StatTile, StatTileSkeleton, TrendChip } from '../components/StatTile'
import { StatusBreakdownChart } from '../components/StatusBreakdownChart'
import { VolumeChart } from '../components/VolumeChart'
import { useDashboardStats } from '../hooks'

function KpiRow() {
  const { t, i18n } = useTranslation('dashboard')
  const fmt = (n: number) => n.toLocaleString(i18n.language)
  const { data: stats, isLoading, isError, error, refetch } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <StatTileSkeleton key={i} />
        ))}
      </div>
    )
  }
  if (isError || !stats) return <ErrorState title={t('stats.loadError')} message={errorMessage(error)} retry={() => void refetch()} />

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatTile label={t('stats.openRequests')} icon={Inbox} value={fmt(stats.openRequests)} trend={{ value: stats.trends.openRequests, upIsGood: false }} />
      <StatTile label={t('stats.pendingUnassigned')} icon={Hourglass} value={fmt(stats.pendingUnassigned)} hint={t('stats.pendingHint')} />
      <StatTile label={t('stats.inProgress')} icon={Wrench} value={fmt(stats.inProgress)} hint={t('stats.inProgressHint')} />
      <StatTile
        label={t('stats.completed30Days')}
        icon={CheckCircle2}
        value={fmt(stats.completedLast30Days)}
        trend={{ value: stats.trends.completedLast30Days, upIsGood: true }}
      />
      <Card className="flex flex-col justify-between gap-3 p-4 sm:col-span-2 xl:col-span-1">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-fg-muted">
            <Clock className="size-3.5 text-fg-subtle" aria-hidden /> {t('stats.avgResolution')}
          </div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-fg">
            {stats.avgResolutionHours.toLocaleString(i18n.language, { maximumFractionDigits: 1 })}
            <span className="ml-1 text-sm font-normal text-fg-muted">{t('stats.hours', { count: stats.avgResolutionHours })}</span>
          </div>
          <div className="mt-1">
            <TrendChip value={stats.trends.avgResolutionHours} upIsGood={false} period={t('trend.vsPrev')} />
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-1.5 text-sm text-fg-muted">
            <Users className="size-3.5 text-fg-subtle" aria-hidden /> {t('stats.availableWorkers')}
          </div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-fg">
            {fmt(stats.availableWorkers)}
            <span className="ml-1 text-sm font-normal text-fg-muted">{t('stats.activeWorkers', { count: stats.activeWorkers })}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation('dashboard')
  const isAdmin = useIsAdmin()
  const [today] = useState(() => new Date())

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title={<span className="inline-flex items-center gap-2.5">{t('page.title')} <MockBadge /></span>}
        description={formatDate(today, 'EEEE, d MMMM yyyy')}
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link to="/requests">{t('page.viewAllRequests')}</Link>
            </Button>
            {isAdmin ? (
              <Button asChild>
                <Link to="/requests/new">
                  <Plus /> {t('page.newRequest')}
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <KpiRow />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <VolumeChart days={30} />
        </div>
        <StatusBreakdownChart />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <NeedsAttentionList />
        <ActivityFeed limit={10} />
      </div>
    </div>
  )
}
