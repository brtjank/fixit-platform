import { CheckCircle2, CircleDot, Timer } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Card, MockBadge, Skeleton } from '@/shared/ui'
import type { WorkerWorkload } from '../api/workersApi'

interface Tile {
  label: string
  value: number | undefined
  icon: LucideIcon
  tone: string
}

export function WorkerStatTiles({ workload, loading }: { workload: WorkerWorkload | null; loading?: boolean }) {
  const tiles: Tile[] = [
    { label: 'Open', value: workload?.open, icon: CircleDot, tone: 'bg-info-soft text-info-fg' },
    { label: 'In progress', value: workload?.inProgress, icon: Timer, tone: 'bg-violet-soft text-violet-fg' },
    { label: 'Completed (30d)', value: workload?.completedLast30Days, icon: CheckCircle2, tone: 'bg-success-soft text-success-fg' },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {tiles.map((t) => (
        <Card key={t.label} className="flex items-center gap-4 p-4">
          <div className={cn('flex size-10 items-center justify-center rounded-lg', t.tone)}>
            <t.icon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-fg-muted">
              {t.label}
              <MockBadge className="px-1 py-0 text-[9px]" />
            </div>
            {loading ? (
              <Skeleton className="mt-1 h-6 w-10" />
            ) : (
              <div className="text-2xl font-semibold text-fg tabular">{t.value ?? '—'}</div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
