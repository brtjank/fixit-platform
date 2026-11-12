import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { BellOff, CheckCheck } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { cn, getDateLocale } from '@/shared/lib'
import { Button, Card, EmptyState, ErrorState, MockBadge, PageHeader, Skeleton } from '@/shared/ui'
import type { Notification } from '../api/notificationsApi'
import { NotificationItem } from '../components/NotificationItem'
import { useMarkAllRead, useMarkRead, useNotifications } from '../hooks'

type Filter = 'all' | 'unread'

function dayLabel(iso: string, t: TFunction<'notifications'>) {
  const d = parseISO(iso)
  if (isToday(d)) return t('groups.today')
  if (isYesterday(d)) return t('groups.yesterday')
  return format(d, 'EEEE, d MMM yyyy', { locale: getDateLocale() })
}

function groupByDay(items: Notification[], t: TFunction<'notifications'>) {
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const groups: { label: string; items: Notification[] }[] = []
  for (const n of sorted) {
    const label = dayLabel(n.createdAt, t)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(n)
    else groups.push({ label, items: [n] })
  }
  return groups
}

export default function NotificationsPage() {
  const { t } = useTranslation('notifications')
  const [filter, setFilter] = useState<Filter>('all')
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useNotifications()
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()

  const unreadCount = data?.filter((n) => !n.readAt).length ?? 0
  const groups = useMemo(() => groupByDay((data ?? []).filter((n) => filter === 'all' || !n.readAt), t), [data, filter, t])

  const open = (n: Notification) => {
    if (!n.readAt) markRead.mutate(n.id)
    if (n.serviceRequestId) navigate(`/requests/${n.serviceRequestId}`)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {t('page.title')} <MockBadge />
          </span>
        }
        description={t('page.description')}
        actions={
          <Button variant="secondary" size="sm" disabled={unreadCount === 0} loading={markAll.isPending} onClick={() => markAll.mutate()}>
            <CheckCheck /> {t('list.markAllRead')}
          </Button>
        }
      />

      <div className="mb-4 flex gap-2" role="group" aria-label={t('filters.label')}>
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
              filter === f ? 'border-transparent bg-brand-soft text-brand-fg' : 'border-border bg-surface text-fg-muted hover:bg-surface-hover',
            )}
          >
            {f === 'unread' && unreadCount > 0 ? t('filters.unreadCount', { count: unreadCount }) : t(`filters.${f}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState retry={() => void refetch()} />
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={BellOff}
            title={t('empty.title')}
            description={filter === 'unread' ? t('empty.unread') : t('empty.all')}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{g.label}</h2>
              <Card className="divide-y divide-border overflow-hidden">
                {g.items.map((n) => (
                  <NotificationItem key={n.id} n={n} onOpen={open} onMarkRead={(x) => markRead.mutate(x.id)} />
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
