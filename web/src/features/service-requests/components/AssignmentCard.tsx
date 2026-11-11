import { ArrowRightLeft, Clock } from 'lucide-react'
import { Link } from 'react-router'
import { formatDateTime, formatRelative, shortId } from '@/shared/lib'
import type { ServiceRequest } from '@/shared/types'
import { Button, Card, StatusBadge, Tooltip } from '@/shared/ui'

interface Props {
  request: ServiceRequest
  customerLabel: string
  canUpdate: boolean
  onUpdateStatus: (request: ServiceRequest) => void
}

export function AssignmentCard({ request, customerLabel, canUpdate, onUpdateStatus }: Props) {
  return (
    <Card className="p-3.5 transition-colors hover:border-border-strong">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-fg-subtle">{shortId(request.id, 'SR')}</span>
        <StatusBadge status={request.status} />
      </div>
      <Link to={`/requests/${request.id}`} className="mt-1.5 block text-sm font-medium text-fg hover:text-brand-fg">
        {request.title}
      </Link>
      <div className="mt-1 truncate text-xs text-fg-muted">{customerLabel}</div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Tooltip content={formatDateTime(request.createdAt)}>
          <span className="inline-flex items-center gap-1 text-xs text-fg-subtle">
            <Clock className="size-3.5" /> {formatRelative(request.createdAt)}
          </span>
        </Tooltip>
        {canUpdate ? (
          <Button size="sm" variant="secondary" onClick={() => onUpdateStatus(request)}>
            <ArrowRightLeft /> Update status
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
