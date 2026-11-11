import { type LabelHTMLAttributes, type ReactNode, useId } from 'react'
import { cn } from '@/shared/lib'

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium text-fg', className)} {...props} />
}

interface FormFieldProps {
  label: ReactNode
  hint?: ReactNode
  error?: string
  required?: boolean
  className?: string
  /** Render-prop receives the generated id + aria props to spread on the control. */
  children: (control: { id: string; 'aria-invalid': boolean; 'aria-describedby': string | undefined }) => ReactNode
}

export function FormField({ label, hint, error, required, className, children }: FormFieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </Label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger-fg">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
