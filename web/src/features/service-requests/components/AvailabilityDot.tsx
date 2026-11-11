import { cn } from '@/shared/lib'

export function AvailabilityDot({ available, className }: { available: boolean; className?: string }) {
  return (
    <span
      className={cn('inline-block size-2 shrink-0 rounded-full', available ? 'bg-success-fg' : 'bg-fg-subtle', className)}
      aria-label={available ? 'Available' : 'Unavailable'}
      title={available ? 'Available' : 'Unavailable'}
    />
  )
}
