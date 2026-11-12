import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DEMO_ACCOUNTS } from '@/mocks/data/seed'
import { cn, roleLabel } from '@/shared/lib'
import { UserRole } from '@/shared/types'
import { RoleBadge } from '@/shared/ui'

export type DemoAccount = (typeof DEMO_ACCOUNTS)[number]

interface DemoAccountsProps {
  onPick: (account: DemoAccount) => void
  disabled?: boolean
  /** Email of the account currently signing in (shows a pending state on that row). */
  pendingEmail?: string | null
}

export function DemoAccounts({ onPick, disabled, pendingEmail }: DemoAccountsProps) {
  const { t } = useTranslation('auth')
  return (
    <section aria-labelledby="demo-accounts-heading" className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" aria-hidden />
        <h2 id="demo-accounts-heading" className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
          {t('demo.heading')}
        </h2>
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>
      <ul className="space-y-2">
        {DEMO_ACCOUNTS.map((account) => {
          const pending = pendingEmail === account.email
          return (
            <li key={account.email}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(account)}
                aria-label={t('demo.signInAs', { name: account.name, role: roleLabel(UserRole[account.role]) })}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5 text-left transition-colors',
                  'hover:border-brand/50 hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60',
                  pending && 'border-brand/60 bg-brand-soft/40',
                )}
              >
                <RoleBadge role={UserRole[account.role]} className="w-18 justify-center" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="truncate text-sm font-medium text-fg">{account.name}</span>
                    <span className="truncate text-xs text-fg-subtle">{account.email}</span>
                  </span>
                  <span className="block truncate text-xs text-fg-muted">{t(`demo.hints.${account.role}`, { defaultValue: account.hint })}</span>
                </span>
                <ArrowRight
                  className={cn(
                    'size-4 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-brand-fg',
                    pending && 'animate-pulse text-brand-fg',
                  )}
                  aria-hidden
                />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
