import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import { Skeleton } from '@/shared/ui'

interface Chip {
  label: string
  value: number
  dot: string
}

export function WorkersSummary({ total, available, busy, loading }: { total: number; available: number; busy: number; loading?: boolean }) {
  const { t } = useTranslation('workers')
  const chips: Chip[] = [
    { label: t('summary.total'), value: total, dot: 'bg-fg-subtle' },
    { label: t('summary.availableNow'), value: available, dot: 'bg-success-fg' },
    { label: t('summary.busy'), value: busy, dot: 'bg-violet-fg' },
  ]
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <div key={c.label} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg-muted shadow-sm">
          <span className={cn('size-1.5 rounded-full', c.dot)} aria-hidden />
          {c.label}
          {loading ? <Skeleton className="h-3.5 w-5" /> : <span className="font-semibold text-fg tabular">{c.value}</span>}
        </div>
      ))}
    </div>
  )
}
