import { ArrowRight, CirclePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUser, useUserDirectory } from '@/features/users/hooks'
import { errorMessage } from '@/shared/api'
import { formatDateTime, formatRelative, fullName } from '@/shared/lib'
import { ServiceRequestStatus, type ServiceRequest } from '@/shared/types'
import { Card, CardContent, CardHeader, ErrorState, Skeleton, StatusBadge, Tooltip } from '@/shared/ui'
import { useServiceRequestLogs } from '../hooks'

function When({ at }: { at: string }) {
  return (
    <Tooltip content={formatDateTime(at)}>
      <time dateTime={at} className="text-xs text-fg-subtle">
        {formatRelative(at)}
      </time>
    </Tooltip>
  )
}

export function RequestTimeline({ request }: { request: ServiceRequest }) {
  const { t } = useTranslation('requests')
  const logs = useServiceRequestLogs(request.id)
  const directory = useUserDirectory()
  // The directory cannot resolve customers for Workers/Customers; fall back to the (mock-only) single-user lookup.
  const customer = useUser(request.customerId)
  const customerLabel = customer.data ? fullName(customer.data) : directory.label(request.customerId, 'CUST')

  return (
    <Card>
      <CardHeader
        title={t('detail.history.title')}
        description={t('detail.history.description')}
      />
      <CardContent>
        {logs.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : logs.isError ? (
          <ErrorState message={errorMessage(logs.error)} retry={() => void logs.refetch()} />
        ) : (
          <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-border">
            <li className="relative flex gap-3">
              <span className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-fg ring-4 ring-surface">
                <CirclePlus className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-fg">{t('detail.history.created')}</span>
                  <StatusBadge status={ServiceRequestStatus.Pending} />
                  <When at={request.createdAt} />
                </div>
                <p className="mt-0.5 text-xs text-fg-muted">{t('detail.history.submittedFor', { name: customerLabel })}</p>
              </div>
            </li>
            {(logs.data ?? []).map((log) => (
              <li key={log.id} className="relative flex gap-3">
                <span className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-bg-subtle ring-4 ring-surface">
                  <span className="size-2 rounded-full bg-fg-subtle" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={log.previousStatus} />
                    <ArrowRight className="size-3.5 text-fg-subtle" aria-label={t('detail.history.to')} />
                    <StatusBadge status={log.newStatus} />
                    <When at={log.createdAt} />
                  </div>
                  {log.notes ? (
                    <p className="mt-1.5 whitespace-pre-line rounded-md bg-bg-subtle px-3 py-2 text-sm text-fg">{log.notes}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-fg-muted">
                    {t('detail.history.by', { name: log.changedByUserId ? directory.label(log.changedByUserId) : t('detail.history.system') })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
