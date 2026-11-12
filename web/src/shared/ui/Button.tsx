import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from 'radix-ui'
import { cn } from '@/shared/lib'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-fg-on-brand hover:bg-brand-hover shadow-sm',
        secondary: 'bg-surface text-fg border border-border-strong/60 hover:bg-surface-hover shadow-sm',
        ghost: 'text-fg-muted hover:bg-surface-hover hover:text-fg',
        soft: 'bg-brand-soft text-brand-fg hover:bg-brand-soft/70',
        danger: 'bg-danger text-white hover:bg-danger-hover shadow-sm',
        'danger-soft': 'bg-danger-soft text-danger-fg hover:bg-danger-soft/70',
        link: 'text-brand-fg underline-offset-4 hover:underline h-auto p-0',
      },
      size: {
        sm: 'h-8 px-3 text-xs [&_svg]:size-3.5',
        md: 'h-9 px-3.5 text-sm [&_svg]:size-4',
        lg: 'h-10 px-4 text-sm [&_svg]:size-4',
        icon: 'size-9 [&_svg]:size-4',
        'icon-sm': 'size-8 [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, loading, disabled, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className)
    // Slot requires exactly one child element — never prepend the spinner when composing.
    if (asChild) {
      return (
        <Slot.Root ref={ref} className={classes} {...props}>
          {children}
        </Slot.Root>
      )
    }
    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {loading ? <Loader2 className="animate-spin" /> : null}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
