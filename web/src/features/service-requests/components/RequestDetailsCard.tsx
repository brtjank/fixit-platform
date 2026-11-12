import { useTranslation } from 'react-i18next'
import { formatDateTime, shortId, statusDescription } from '@/shared/lib'
import type { ServiceRequest } from '@/shared/types'
import { Card, CardContent, CardHeader, StatusBadge } from '@/shared/ui'
import { CopyButton } from './CopyButton'

function IdRow({ label, copyLabel, id }: { label: string; copyLabel: string; id: string | null }) {
  return (
    <div>
      <dt className="text-xs text-fg-subtle">{label}</dt>
      <dd className="flex items-center gap-1">
        {id ? (
          <>
            <span className="min-w-0 truncate font-mono text-xs text-fg-muted" title={id}>
              {id}
            </span>
            <CopyButton value={id} label={copyLabel} />
          </>
        ) : (
          <span className="text-xs text-fg-subtle">—</span>
        )}
      </dd>
    </div>
  )
}

export function RequestDetailsCard({ request }: { request: ServiceRequest }) {
  const { t } = useTranslation('requests')
  return (
    <Card>
      <CardHeader title={t('detail.details.title')} />
      <CardContent>
        <dl className="space-y-3">
          <div>
            <dt className="text-xs text-fg-subtle">{t('detail.details.status')}</dt>
            <dd className="mt-1 flex flex-col items-start gap-1">
              <StatusBadge status={request.status} />
              <span className="text-xs text-fg-muted">{statusDescription(request.status)}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-fg-subtle">{t('detail.details.reference')}</dt>
            <dd className="font-mono text-sm text-fg">{shortId(request.id, 'SR')}</dd>
          </div>
          <div>
            <dt className="text-xs text-fg-subtle">{t('detail.details.created')}</dt>
            <dd className="text-sm text-fg">{formatDateTime(request.createdAt)}</dd>
          </div>
          <IdRow label={t('detail.details.requestId')} copyLabel={t('detail.details.copyRequestId')} id={request.id} />
          <IdRow label={t('detail.details.customerId')} copyLabel={t('detail.details.copyCustomerId')} id={request.customerId} />
          <IdRow label={t('detail.details.workerId')} copyLabel={t('detail.details.copyWorkerId')} id={request.assignedWorkerId} />
        </dl>
      </CardContent>
    </Card>
  )
}
