import { Tabs as Radix } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib'

export const Tabs = Radix.Root
export const TabsContent = Radix.Content

export function TabsList({ className, ...props }: ComponentProps<typeof Radix.List>) {
  return <Radix.List className={cn('inline-flex h-9 items-center gap-1 rounded-lg bg-bg-subtle p-1', className)} {...props} />
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof Radix.Trigger>) {
  return (
    <Radix.Trigger
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-fg-muted transition-colors data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-sm hover:text-fg',
        className,
      )}
      {...props}
    />
  )
}
