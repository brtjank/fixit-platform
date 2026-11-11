import { Loader2, type LucideIcon } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn, initials } from '@/shared/lib'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-md bg-[linear-gradient(90deg,var(--surface-hover)_25%,var(--border)_50%,var(--surface-hover)_75%)] bg-[length:200%_100%] [animation:shimmer_1.6s_linear_infinite]', className)}
      {...props}
    />
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-fg-subtle', className)} aria-label="Loading" />
}

export function PageSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner className="size-6" />
    </div>
  )
}

export function Separator({ className, vertical }: { className?: string; vertical?: boolean }) {
  return <div role="separator" className={cn(vertical ? 'h-5 w-px' : 'h-px w-full', 'bg-border', className)} />
}

export function Avatar({
  user,
  size = 'md',
  className,
}: {
  user: { firstName: string; lastName: string } | null | undefined
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = { xs: 'size-6 text-[10px]', sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-12 text-sm' }
  // Stable hue per name so avatars are distinguishable yet consistent.
  const seed = user ? `${user.firstName}${user.lastName}` : '?'
  const hue = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0)
  return (
    <span
      className={cn('inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ring-1 ring-inset ring-black/5 dark:ring-white/10', sizes[size], className)}
      style={{ background: `oklch(90% 0.06 ${hue})`, color: `oklch(35% 0.12 ${hue})` }}
      aria-hidden
    >
      {initials(user)}
    </span>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {Icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-bg-subtle text-fg-subtle">
          <Icon className="size-5" />
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  breadcrumb?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {breadcrumb ? <div className="mb-2 text-xs text-fg-subtle">{breadcrumb}</div> : null}
        <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

/** Small inline marker for UI backed by mock-only endpoints. */
export function MockBadge({ className, label = 'Mocked' }: { className?: string; label?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded border border-dashed border-warning-fg/40 bg-warning-soft px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning-fg', className)}
      title="This data comes from a mock endpoint — the backend does not implement it yet (see docs/API_GAPS.md)."
    >
      {label}
    </span>
  )
}

export function ErrorState({ title = 'Something went wrong', message, retry }: { title?: string; message?: string; retry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-danger-fg/30 bg-danger-soft/40 px-6 py-10 text-center">
      <h3 className="text-sm font-semibold text-danger-fg">{title}</h3>
      {message ? <p className="mt-1 max-w-md text-sm text-fg-muted">{message}</p> : null}
      {retry ? (
        <button type="button" onClick={retry} className="mt-4 text-sm font-medium text-brand-fg underline-offset-4 hover:underline">
          Try again
        </button>
      ) : null}
    </div>
  )
}
