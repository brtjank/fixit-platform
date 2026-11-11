import { CheckCircle2, History, PlusCircle, RefreshCw, UserCheck, XCircle, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { errorMessage } from '@/shared/api'
import { cn, formatDateTime, formatRelative } from '@/shared/lib'
import { Card, CardContent, CardHeader, EmptyState, ErrorState, MockBadge, Skeleton } from '@/shared/ui'
import type { ActivityItem } from '../api/dashboardApi'
import { useActivity } from '../hooks'

const TYPE_META: Record<ActivityItem['type'], { icon: LucideIcon; verb: string; className: string }> = {
  created: { icon: PlusCircle, verb: 'created', className: 'bg-brand-soft text-brand-fg' },
  assigned: { icon: UserCheck, verb: 'assigned a worker to', className: 'bg-info-soft text-info-fg' },
  status_changed: { icon: RefreshCw, verb: 'updated', className: 'bg-violet-soft text-violet-fg' },
  completed: { icon: CheckCircle2, verb: 'completed', className: 'bg-success-soft text-success-fg' },
  cancelled: { icon: XCircle, verb: 'cancelled', className: 'bg-neutral-soft text-neutral-fg' },
}

export function ActivityFeed({ limit = 10 }: { limit?: number }) {
  const query = useActivity(limit)
  const items = query.data ?? []

  return (
    <Card className="flex flex-col">
      <CardHeader title={<span className="inline-flex items-center gap-2">Recent activity <MockBadge /></span>} description="Latest changes across all requests" />
      <CardContent className="flex-1">
        {query.isLoading ? (
          <ul className="space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex gap-3">
                <Skeleton className="size-7 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </li>
            ))}
          </ul>
        ) : query.isError ? (
          <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon={History} title="No activity yet" description="Changes to service requests will show up here." />
        ) : (
          <ol className="relative space-y-4">
            {items.map((item, i) => {
              const meta = TYPE_META[item.type] ?? TYPE_META.status_changed
              const Icon = meta.icon
              return (
                <li key={item.id} className="relative flex gap-3">
                  {i < items.length - 1 ? <span className="absolute left-3.5 top-8 -bottom-4 w-px bg-border" aria-hidden /> : null}
                  <span className={cn('relative flex size-7 shrink-0 items-center justify-center rounded-full', meta.className)}>
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm text-fg-muted">
                      <span className="font-medium text-fg">{item.actorName}</span> {meta.verb}{' '}
                      <Link to={`/requests/${item.serviceRequestId}`} className="font-medium text-fg hover:text-brand-fg hover:underline underline-offset-4">
                        {item.serviceRequestTitle}
                      </Link>
                    </p>
                    {item.detail ? (
                      <p className="mt-0.5 truncate text-xs text-fg-muted" title={item.detail}>
                        {item.detail}
                      </p>
                    ) : null}
                    <time dateTime={item.occurredAt} title={formatDateTime(item.occurredAt)} className="mt-0.5 block text-xs text-fg-subtle">
                      {formatRelative(item.occurredAt)}
                    </time>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
