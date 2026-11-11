import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui'

export function CopyButton({ value, label = 'Copy', iconOnly }: { value: string; label?: string; iconOnly?: boolean }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Could not copy')
    }
  }
  return iconOnly ? (
    <Button type="button" variant="ghost" size="icon-sm" onClick={copy} aria-label={label}>
      <Copy />
    </Button>
  ) : (
    <Button type="button" variant="secondary" size="sm" onClick={copy}>
      <Copy /> {label}
    </Button>
  )
}
