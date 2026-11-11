import { ChevronRight, Clock, User as UserIcon } from 'lucide-react'
import { Link } from 'react-router'
import { formatDateTime, formatRelative, shortId } from '@/shared/lib'
import type { ServiceRequest } from '@/shared/types'
import { Card, StatusBadge, Tooltip } from '@/shared/ui'

/** Customer-facing card (My requests). Worker names are not resolvable for customers without the users endpoint. */
export function RequestCard({ request, workerLabel }: { request: ServiceRequest; workerLabel: string | null }) {
  return (
    <Link to={`/requests/${request.id}`} className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="p-4 transition-colors group-hover:border-border-strong group-hover:bg-surface-hover">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[11px] text-fg-subtle">{shortId(request.id, 'SR')}</div>
            <h3 className="truncate text-sm font-semibold text-fg">{request.title}</h3>
          </div>
          <StatusBadge status={request.status} />
        </div>
        {request.notes ? (
          <p className="mt-2 line-clamp-2 text-sm text-fg-muted">
            <span className="text-fg-subtle">Latest note: </span>
            {request.notes}
          </p>
        ) : (
          <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{request.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-subtle">
          <Tooltip content={formatDateTime(request.createdAt)}>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {formatRelative(request.createdAt)}
            </span>
          </Tooltip>
          <span className="inline-flex items-center gap-1">
            <UserIcon className="size-3.5" />
            {workerLabel ?? <span className="text-warning-fg">Waiting for assignment</span>}
          </span>
          <ChevronRight className="ml-auto size-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </Card>
    </Link>
  )
}
