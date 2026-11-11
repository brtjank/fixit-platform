import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn, ROLE_META, STATUS_META, type Tone } from '@/shared/lib'
import type { ServiceRequestStatus, UserRole } from '@/shared/types'

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-neutral-soft text-neutral-fg',
        info: 'bg-info-soft text-info-fg',
        warning: 'bg-warning-soft text-warning-fg',
        success: 'bg-success-soft text-success-fg',
        danger: 'bg-danger-soft text-danger-fg',
        violet: 'bg-violet-soft text-violet-fg',
        brand: 'bg-brand-soft text-brand-fg',
      } satisfies Record<Tone, string>,
      outline: {
        true: 'bg-transparent border-current/20',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export function Badge({ className, tone, outline, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, outline }), className)} {...props}>
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  )
}

export function StatusBadge({ status, className }: { status: ServiceRequestStatus; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <Badge tone={meta?.tone ?? 'neutral'} dot className={className}>
      {meta?.label ?? `Status ${status}`}
    </Badge>
  )
}

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  const meta = ROLE_META[role]
  return (
    <Badge tone={meta?.tone ?? 'neutral'} className={className}>
      {meta?.label ?? `Role ${role}`}
    </Badge>
  )
}
