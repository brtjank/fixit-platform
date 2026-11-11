import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { BellOff, CheckCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { cn } from '@/shared/lib'
import { Button, Card, EmptyState, ErrorState, MockBadge, PageHeader, Skeleton } from '@/shared/ui'
import type { Notification } from '../api/notificationsApi'
import { NotificationItem } from '../components/NotificationItem'
import { useMarkAllRead, useMarkRead, useNotifications } from '../hooks'

type Filter = 'all' | 'unread'

function dayLabel(iso: string) {
  const d = parseISO(iso)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEEE, d MMM yyyy')
}

function groupByDay(items: Notification[]) {
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const groups: { label: string; items: Notification[] }[] = []
  for (const n of sorted) {
    const label = dayLabel(n.createdAt)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(n)
    else groups.push({ label, items: [n] })
  }
  return groups
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useNotifications()
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()

  const unreadCount = data?.filter((n) => !n.readAt).length ?? 0
  const groups = useMemo(() => groupByDay((data ?? []).filter((n) => filter === 'all' || !n.readAt)), [data, filter])

  const open = (n: Notification) => {
    if (!n.readAt) markRead.mutate(n.id)
    if (n.serviceRequestId) navigate(`/requests/${n.serviceRequestId}`)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Notifications <MockBadge />
          </span>
        }
        description="Updates about requests in your organization"
        actions={
          <Button variant="secondary" size="sm" disabled={unreadCount === 0} loading={markAll.isPending} onClick={() => markAll.mutate()}>
            <CheckCheck /> Mark all as read
          </Button>
        }
      />

      <div className="mb-4 flex gap-2" role="group" aria-label="Filter">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm font-medium capitalize transition-colors',
              filter === f ? 'border-transparent bg-brand-soft text-brand-fg' : 'border-border bg-surface text-fg-muted hover:bg-surface-hover',
            )}
          >
            {f}
            {f === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
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
            title="You're all caught up"
            description={filter === 'unread' ? 'No unread notifications.' : 'New updates about requests will show up here.'}
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
