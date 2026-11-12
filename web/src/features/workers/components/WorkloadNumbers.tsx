import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import type { WorkerWorkload } from '../api/workersApi'

const ITEMS = [
  { key: 'open', labelKey: 'workload.open' },
  { key: 'inProgress', labelKey: 'workload.inProgress' },
  { key: 'completedLast30Days', labelKey: 'workload.done30d' },
] as const satisfies ReadonlyArray<{ key: keyof Omit<WorkerWorkload, 'workerId'>; labelKey: string }>

/** Compact open / in progress / completed-30d counters. */
export function WorkloadNumbers({ workload, className }: { workload: WorkerWorkload | null; className?: string }) {
  const { t } = useTranslation('workers')
  return (
    <dl className={cn('grid grid-cols-3 divide-x divide-border rounded-md border border-border bg-bg-subtle', className)}>
      {ITEMS.map((item) => (
        <div key={item.key} className="px-2 py-2 text-center">
          <dt className="text-[11px] text-fg-subtle">{t(item.labelKey)}</dt>
          <dd className="mt-0.5 text-sm font-semibold text-fg tabular">{workload ? workload[item.key] : '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
