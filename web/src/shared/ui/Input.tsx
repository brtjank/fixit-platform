import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib'

const base =
  'w-full rounded-md border border-border bg-surface px-3 text-sm text-fg shadow-sm placeholder:text-fg-subtle transition-colors hover:border-border-strong focus:border-brand focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/30'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(base, 'h-9', className)} {...props} />
))
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, 'min-h-24 py-2 leading-relaxed', className)} {...props} />
))
Textarea.displayName = 'Textarea'

export const NativeSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select ref={ref} className={cn(base, 'h-9 appearance-none pr-9', className)} {...props}>
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
  </div>
))
NativeSelect.displayName = 'NativeSelect'
