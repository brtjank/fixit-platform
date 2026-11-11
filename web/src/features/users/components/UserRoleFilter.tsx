import { cn, ROLE_META } from '@/shared/lib'
import { UserRole } from '@/shared/types'

export type RoleFilterValue = UserRole | 'all'

const OPTIONS: Array<{ value: RoleFilterValue; label: string }> = [
  { value: 'all', label: 'All' },
  { value: UserRole.Admin, label: ROLE_META[UserRole.Admin].label },
  { value: UserRole.Worker, label: ROLE_META[UserRole.Worker].label },
  { value: UserRole.Customer, label: ROLE_META[UserRole.Customer].label },
]

interface UserRoleFilterProps {
  value: RoleFilterValue
  onChange: (value: RoleFilterValue) => void
  counts?: Partial<Record<RoleFilterValue, number>>
  className?: string
}

/** Pill-style role filter (All / Admin / Worker / Customer). */
export function UserRoleFilter({ value, onChange, counts, className }: UserRoleFilterProps) {
  return (
    <div role="radiogroup" aria-label="Filter by role" className={cn('inline-flex flex-wrap items-center gap-1', className)}>
      {OPTIONS.map((opt) => {
        const active = opt.value === value
        const count = counts?.[opt.value]
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'border-transparent bg-brand-soft text-brand-fg'
                : 'border-border bg-surface text-fg-muted hover:bg-surface-hover hover:text-fg',
            )}
          >
            {opt.label}
            {count !== undefined ? <span className="tabular text-[11px] opacity-70">{count}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
