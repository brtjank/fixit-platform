import { Switch as Radix } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib'

export function Switch({ className, ...props }: ComponentProps<typeof Radix.Root>) {
  return (
    <Radix.Root
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-border-strong transition-colors data-[state=checked]:bg-brand disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <Radix.Thumb className="block size-4 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4" />
    </Radix.Root>
  )
}
