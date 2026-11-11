import { ChevronRight, Inbox } from 'lucide-react'
import { Link } from 'react-router'
import { useServiceRequests } from '@/features/service-requests/hooks'
import { useUserDirectory } from '@/features/users/hooks'
import { errorMessage } from '@/shared/api'
import { formatRelative, shortId } from '@/shared/lib'
import { ServiceRequestStatus } from '@/shared/types'
import { Button, Card, CardContent, CardHeader, EmptyState, ErrorState, Skeleton, StatusBadge } from '@/shared/ui'

export function NeedsAttentionList() {
  const query = useServiceRequests({ status: ServiceRequestStatus.Pending, page: 1, pageSize: 5 })
  const directory = useUserDirectory()
  const items = query.data?.items ?? []
  const total = query.data?.totalCount ?? 0

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Needs attention"
        description={query.data ? `${total} pending ${total === 1 ? 'request' : 'requests'} waiting for a worker` : 'Pending requests waiting for a worker'}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/requests?status=Pending">
              View all <ChevronRight />
            </Link>
          </Button>
        }
      />
      <CardContent className="flex-1 p-0">
        {query.isLoading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="space-y-2 px-5 py-3.5">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </li>
            ))}
          </ul>
        ) : query.isError ? (
          <div className="p-5">
            <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={Inbox} title="All caught up" description="There are no pending requests waiting for assignment." />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((sr) => (
              <li key={sr.id}>
                <Link to={`/requests/${sr.id}`} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-hover">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-fg group-hover:text-brand-fg">{sr.title}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-fg-muted">
                      <span className="font-mono text-fg-subtle">{shortId(sr.id, 'SR')}</span>
                      <span aria-hidden>·</span>
                      <span className="truncate">{directory.label(sr.customerId, 'CUST')}</span>
                      <span aria-hidden>·</span>
                      <span className="whitespace-nowrap">{formatRelative(sr.createdAt)}</span>
                    </div>
                  </div>
                  <StatusBadge status={sr.status} className="hidden sm:inline-flex" />
                  <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
