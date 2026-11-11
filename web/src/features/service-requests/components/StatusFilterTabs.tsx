import { ALL_STATUSES, cn, STATUS_META } from '@/shared/lib'
import type { ServiceRequestStatus } from '@/shared/types'

interface Props {
  value: ServiceRequestStatus | undefined
  onChange: (value: ServiceRequestStatus | undefined) => void
}

/** Pill-style status filter: "All" + each status. */
export function StatusFilterTabs({ value, onChange }: Props) {
  const options: { key: string; label: string; value: ServiceRequestStatus | undefined }[] = [
    { key: 'all', label: 'All', value: undefined },
    ...ALL_STATUSES.map((s) => ({ key: String(s), label: STATUS_META[s].label, value: s })),
  ]
  return (
    <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors',
              active
                ? 'border-transparent bg-fg text-bg'
                : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
