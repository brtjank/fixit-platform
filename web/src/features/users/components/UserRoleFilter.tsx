import { useTranslation } from 'react-i18next'
import { cn, roleLabel } from '@/shared/lib'
import { UserRole } from '@/shared/types'

export type RoleFilterValue = UserRole | 'all'

const OPTIONS: RoleFilterValue[] = ['all', UserRole.Admin, UserRole.Worker, UserRole.Customer]

interface UserRoleFilterProps {
  value: RoleFilterValue
  onChange: (value: RoleFilterValue) => void
  counts?: Partial<Record<RoleFilterValue, number>>
  className?: string
}

/** Pill-style role filter (All / Admin / Worker / Customer). */
export function UserRoleFilter({ value, onChange, counts, className }: UserRoleFilterProps) {
  const { t } = useTranslation('users')
  return (
    <div role="radiogroup" aria-label={t('toolbar.roleLabel')} className={cn('inline-flex flex-wrap items-center gap-1', className)}>
      {OPTIONS.map((option) => {
        const active = option === value
        const count = counts?.[option]
        return (
          <button
            key={String(option)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'border-transparent bg-brand-soft text-brand-fg'
                : 'border-border bg-surface text-fg-muted hover:bg-surface-hover hover:text-fg',
            )}
          >
            {option === 'all' ? t('toolbar.allRoles') : roleLabel(option)}
            {count !== undefined ? <span className="tabular text-[11px] opacity-70">{count}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
