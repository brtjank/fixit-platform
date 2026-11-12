import type { ReactNode } from 'react'
import { Tooltip } from '@/shared/ui'

/** Wraps a (possibly disabled) control so the tooltip still works — disabled buttons swallow pointer events. */
export function DisabledReason({ reason, children }: { reason: string | null; children: ReactNode }) {
  if (!reason) return <>{children}</>
  return (
    <Tooltip content={reason}>
      <span tabIndex={0} className="inline-flex cursor-not-allowed rounded-md">
        {children}
      </span>
    </Tooltip>
  )
}
