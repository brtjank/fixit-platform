import { AlertCircle } from 'lucide-react'
import { errorMessage } from '@/shared/api'

export function InlineError({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <div role="alert" className="mt-4 flex items-start gap-2 rounded-md border border-danger-fg/20 bg-danger-soft px-3 py-2 text-sm text-danger-fg">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{errorMessage(error)}</span>
    </div>
  )
}
