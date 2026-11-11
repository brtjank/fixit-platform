import { BarChart3, Table2 } from 'lucide-react'
import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate } from '@/shared/lib'
import { Button, Card, CardContent, CardHeader, ErrorState, MockBadge, Skeleton } from '@/shared/ui'
import { errorMessage } from '@/shared/api'
import { useVolume } from '../hooks'
import type { DailyVolumePoint } from '../api/dashboardApi'

/**
 * Chart-local series palette (validated with the dataviz validator: CVD ΔE ≥ 12, contrast ≥ 3:1 in both themes).
 * Light/dark steps are selected separately, not flipped.
 */
const VIZ_VARS = '[--viz-created:#00978a] [--viz-completed:#6250d6] dark:[--viz-created:#1f9e92] dark:[--viz-completed:#9085e9]'

const SERIES = [
  { key: 'created', label: 'Created', color: 'var(--viz-created)' },
  { key: 'completed', label: 'Completed', color: 'var(--viz-completed)' },
] as const

const AXIS_TICK = { fill: 'var(--fg-subtle)', fontSize: 11 }

interface TooltipProps {
  active?: boolean
  label?: unknown
  payload?: ReadonlyArray<{ dataKey?: unknown; value?: unknown }>
}

function VolumeTooltip({ active, label, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-36 rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <div className="mb-1.5 font-medium text-fg">{formatDate(String(label), 'EEE, d MMM')}</div>
      {SERIES.map((s) => {
        const v = payload.find((p) => p.dataKey === s.key)?.value
        return (
          <div key={s.key} className="flex items-center gap-2 py-0.5">
            <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} aria-hidden />
            <span className="text-fg-muted">{s.label}</span>
            <span className="ml-auto font-medium text-fg tabular">{String(v ?? 0)}</span>
          </div>
        )
      })}
    </div>
  )
}

function VolumeTable({ data }: { data: DailyVolumePoint[] }) {
  return (
    <div className="max-h-[260px] overflow-y-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Requests created and completed per day</caption>
        <thead className="sticky top-0 bg-surface text-xs text-fg-subtle">
          <tr className="border-b border-border">
            <th className="py-2 text-left font-medium">Date</th>
            <th className="py-2 text-right font-medium">Created</th>
            <th className="py-2 text-right font-medium">Completed</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {[...data].reverse().map((d) => (
            <tr key={d.date} className="border-b border-border last:border-0">
              <td className="py-1.5 text-fg-muted">{formatDate(d.date, 'EEE, d MMM')}</td>
              <td className="py-1.5 text-right text-fg">{d.created}</td>
              <td className="py-1.5 text-right text-fg">{d.completed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function VolumeChart({ days = 30 }: { days?: number }) {
  const query = useVolume(days)
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const data = query.data ?? []
  const totals = { created: data.reduce((n, d) => n + d.created, 0), completed: data.reduce((n, d) => n + d.completed, 0) }

  return (
    <Card className={VIZ_VARS}>
      <CardHeader
        title={<span className="inline-flex items-center gap-2">Requests volume <MockBadge /></span>}
        description={`Created vs completed per day — last ${days} days`}
        actions={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
            aria-label={view === 'chart' ? 'Show as table' : 'Show as chart'}
            title={view === 'chart' ? 'Show as table' : 'Show as chart'}
          >
            {view === 'chart' ? <Table2 /> : <BarChart3 />}
          </Button>
        }
      />
      <CardContent>
        {query.isLoading ? (
          <Skeleton className="h-[292px] w-full" />
        ) : query.isError ? (
          <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />
        ) : (
          <>
            <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs" aria-label="Legend">
              {SERIES.map((s) => (
                <li key={s.key} className="flex items-center gap-2">
                  <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} aria-hidden />
                  <span className="text-fg-muted">{s.label}</span>
                  <span className="font-medium text-fg">{totals[s.key]}</span>
                </li>
              ))}
            </ul>
            {view === 'table' ? (
              <VolumeTable data={data} />
            ) : (
              <div className="h-[260px]" role="img" aria-label={`Area chart: ${totals.created} requests created and ${totals.completed} completed in the last ${days} days`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" tickFormatter={(v: string) => formatDate(v, 'd MMM')} tick={AXIS_TICK} axisLine={{ stroke: 'var(--border)' }} tickLine={false} minTickGap={28} tickMargin={8} />
                    <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={44} />
                    <Tooltip
                      cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
                      content={(p) => <VolumeTooltip active={p.active} label={p.label} payload={p.payload} />}
                    />
                    {SERIES.map((s) => (
                      <Area
                        key={s.key}
                        type="monotone"
                        dataKey={s.key}
                        name={s.label}
                        stroke={s.color}
                        strokeWidth={2}
                        fill={s.color}
                        fillOpacity={0.1}
                        dot={false}
                        activeDot={{ r: 4, fill: s.color, stroke: 'var(--surface)', strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
