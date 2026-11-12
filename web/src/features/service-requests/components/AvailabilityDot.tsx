import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'

export function AvailabilityDot({ available, className }: { available: boolean; className?: string }) {
  const { t } = useTranslation('requests')
  const label = available ? t('shared.available') : t('shared.unavailable')
  return (
    <span
      className={cn('inline-block size-2 shrink-0 rounded-full', available ? 'bg-success-fg' : 'bg-fg-subtle', className)}
      aria-label={label}
      title={label}
    />
  )
}
