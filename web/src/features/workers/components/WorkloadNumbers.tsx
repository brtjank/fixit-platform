import { cn } from '@/shared/lib'
import type { WorkerWorkload } from '../api/workersApi'

const ITEMS: Array<{ key: keyof Omit<WorkerWorkload, 'workerId'>; label: string }> = [
  { key: 'open', label: 'Open' },
  { key: 'inProgress', label: 'In progress' },
  { key: 'completedLast30Days', label: 'Done 30d' },
]

/** Compact open / in progress / completed-30d counters. */
export function WorkloadNumbers({ workload, className }: { workload: WorkerWorkload | null; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-3 divide-x divide-border rounded-md border border-border bg-bg-subtle', className)}>
      {ITEMS.map((item) => (
        <div key={item.key} className="px-2 py-2 text-center">
          <dt className="text-[11px] text-fg-subtle">{item.label}</dt>
          <dd className="mt-0.5 text-sm font-semibold text-fg tabular">{workload ? workload[item.key] : '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
