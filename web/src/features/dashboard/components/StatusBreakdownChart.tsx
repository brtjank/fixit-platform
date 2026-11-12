import { useTranslation } from 'react-i18next'
import { errorMessage } from '@/shared/api'
import { ALL_STATUSES, STATUS_META, statusDescription, statusLabel, type Tone } from '@/shared/lib'
import { Card, CardContent, CardHeader, ErrorState, MockBadge, Skeleton, Tooltip } from '@/shared/ui'
import { useStatusBreakdown } from '../hooks'

/** Status fills reuse the status tone tokens so bars match StatusBadge in both themes. */
const TONE_FILL: Record<Tone, string> = {
  neutral: 'bg-neutral-fg',
  info: 'bg-info-fg',
  warning: 'bg-warning-fg',
  success: 'bg-success-fg',
  danger: 'bg-danger-fg',
  violet: 'bg-violet-fg',
  brand: 'bg-brand',
}

export function StatusBreakdownChart() {
  const { t } = useTranslation('dashboard')
  const query = useStatusBreakdown()
  const counts = new Map((query.data ?? []).map((b) => [b.status, b.count]))
  const rows = ALL_STATUSES.map((status) => ({ meta: STATUS_META[status], count: counts.get(status) ?? 0 }))
  const total = rows.reduce((n, r) => n + r.count, 0)
  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <Card className="flex flex-col">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            {t('breakdown.title')} <MockBadge />
          </span>
        }
        description={query.data ? t('breakdown.total', { count: total }) : t('breakdown.allRequests')}
      />
      <CardContent className="flex-1">
        {query.isLoading ? (
          <div className="space-y-5 py-1">
            {ALL_STATUSES.map((s) => (
              <div key={s} className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-2.5 w-full" />
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />
        ) : (
          <ul className="space-y-4" aria-label={t('breakdown.listLabel')}>
            {rows.map(({ meta, count }) => {
              const share = total === 0 ? 0 : Math.round((count / total) * 100)
              const label = statusLabel(meta.value)
              return (
                <li key={meta.value}>
                  <Tooltip content={t('breakdown.tooltip', { status: label, count, share, description: statusDescription(meta.value) })}>
                    <div className="group rounded-md outline-none" tabIndex={0} aria-label={t('breakdown.rowLabel', { status: label, count, share })}>
                      <div className="mb-1.5 flex items-center gap-2 text-sm">
                        <span className={`size-2 rounded-full ${TONE_FILL[meta.tone]}`} aria-hidden />
                        <span className="text-fg">{label}</span>
                        <span className="ml-auto font-medium text-fg tabular">{count}</span>
                        <span className="w-10 text-right text-xs text-fg-subtle tabular">{share}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-r-[4px] bg-bg-subtle" aria-hidden>
                        <div
                          className={`h-full rounded-r-[4px] transition-[width,opacity] group-hover:opacity-80 ${TONE_FILL[meta.tone]}`}
                          style={{ width: `${(count / max) * 100}%`, minWidth: count > 0 ? 4 : 0 }}
                        />
                      </div>
                    </div>
                  </Tooltip>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
