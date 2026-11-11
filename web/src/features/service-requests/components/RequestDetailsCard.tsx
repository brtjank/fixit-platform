import { formatDateTime, shortId, STATUS_META } from '@/shared/lib'
import type { ServiceRequest } from '@/shared/types'
import { Card, CardContent, CardHeader, StatusBadge } from '@/shared/ui'
import { CopyButton } from './CopyButton'

function IdRow({ label, id }: { label: string; id: string | null }) {
  return (
    <div>
      <dt className="text-xs text-fg-subtle">{label}</dt>
      <dd className="flex items-center gap-1">
        {id ? (
          <>
            <span className="min-w-0 truncate font-mono text-xs text-fg-muted" title={id}>
              {id}
            </span>
            <CopyButton value={id} label={`Copy ${label.toLowerCase()}`} />
          </>
        ) : (
          <span className="text-xs text-fg-subtle">—</span>
        )}
      </dd>
    </div>
  )
}

export function RequestDetailsCard({ request }: { request: ServiceRequest }) {
  const meta = STATUS_META[request.status]
  return (
    <Card>
      <CardHeader title="Details" />
      <CardContent>
        <dl className="space-y-3">
          <div>
            <dt className="text-xs text-fg-subtle">Status</dt>
            <dd className="mt-1 flex flex-col items-start gap-1">
              <StatusBadge status={request.status} />
              <span className="text-xs text-fg-muted">{meta?.description}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-fg-subtle">Reference</dt>
            <dd className="font-mono text-sm text-fg">{shortId(request.id, 'SR')}</dd>
          </div>
          <div>
            <dt className="text-xs text-fg-subtle">Created</dt>
            <dd className="text-sm text-fg">{formatDateTime(request.createdAt)}</dd>
          </div>
          <IdRow label="Request ID" id={request.id} />
          <IdRow label="Customer ID" id={request.customerId} />
          <IdRow label="Worker ID" id={request.assignedWorkerId} />
        </dl>
      </CardContent>
    </Card>
  )
}
