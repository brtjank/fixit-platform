import { DropdownMenu as Radix } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib'

export const DropdownMenu = Radix.Root
export const DropdownMenuTrigger = Radix.Trigger

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: ComponentProps<typeof Radix.Content>) {
  return (
    <Radix.Portal>
      <Radix.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-44 overflow-hidden rounded-lg border border-border bg-surface p-1 text-sm shadow-lg data-[state=open]:animate-in',
          className,
        )}
        {...props}
      />
    </Radix.Portal>
  )
}

export function DropdownMenuItem({ className, destructive, ...props }: ComponentProps<typeof Radix.Item> & { destructive?: boolean }) {
  return (
    <Radix.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-1.5 outline-none transition-colors data-[highlighted]:bg-surface-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-fg-subtle',
        destructive && 'text-danger-fg data-[highlighted]:bg-danger-soft [&_svg]:text-danger-fg',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof Radix.Label>) {
  return <Radix.Label className={cn('px-2.5 py-1.5 text-xs font-medium text-fg-subtle', className)} {...props} />
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof Radix.Separator>) {
  return <Radix.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
}
