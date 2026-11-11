import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { Card, Skeleton } from '@/shared/ui'

export interface TrendInfo {
  /** % change vs previous period, e.g. 12.5 or -4 */
  value: number
  /** Whether an increase is good news (drives success/danger tone). */
  upIsGood: boolean
  period?: string
}

export function TrendChip({ value, upIsGood, period = 'vs prev. 30 days' }: TrendInfo) {
  const flat = Math.abs(value) < 0.05
  const up = value > 0
  const good = flat ? null : up === upIsGood
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  const text = `${flat ? '0' : Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium tabular',
          good === null ? 'bg-neutral-soft text-neutral-fg' : good ? 'bg-success-soft text-success-fg' : 'bg-danger-soft text-danger-fg',
        )}
        aria-label={`${flat ? 'No change' : up ? 'Up' : 'Down'} ${text} ${period}`}
      >
        <Icon className="size-3" aria-hidden />
        {text}
      </span>
      <span className="text-fg-subtle">{period}</span>
    </span>
  )
}

interface StatTileProps {
  label: string
  value: ReactNode
  icon?: LucideIcon
  trend?: TrendInfo
  hint?: ReactNode
  className?: string
}

export function StatTile({ label, value, icon: Icon, trend, hint, className }: StatTileProps) {
  return (
    <Card className={cn('flex flex-col gap-3 p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-fg-muted">{label}</span>
        {Icon ? (
          <span className="flex size-7 items-center justify-center rounded-md bg-bg-subtle text-fg-subtle">
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <div className="text-3xl font-semibold tracking-tight text-fg">{value}</div>
      <div className="min-h-5">{trend ? <TrendChip {...trend} /> : hint ? <span className="text-xs text-fg-subtle">{hint}</span> : null}</div>
    </Card>
  )
}

export function StatTileSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('flex flex-col gap-3 p-4', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-4 w-32" />
    </Card>
  )
}
