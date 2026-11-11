import { Tooltip as Radix } from 'radix-ui'
import type { ReactNode } from 'react'

export const TooltipProvider = Radix.Provider

export function Tooltip({ content, children, side = 'top' }: { content: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <Radix.Root delayDuration={300}>
      <Radix.Trigger asChild>{children}</Radix.Trigger>
      <Radix.Portal>
        <Radix.Content
          side={side}
          sideOffset={6}
          className="z-50 max-w-xs rounded-md bg-fg px-2.5 py-1.5 text-xs text-bg shadow-md data-[state=delayed-open]:animate-in"
        >
          {content}
          <Radix.Arrow className="fill-fg" />
        </Radix.Content>
      </Radix.Portal>
    </Radix.Root>
  )
}
