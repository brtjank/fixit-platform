import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { Button, Tooltip } from '@/shared/ui'

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable (insecure context) — ignore */
    }
  }
  return (
    <Tooltip content={copied ? 'Copied' : label}>
      <Button variant="ghost" size="icon-sm" className="size-7" aria-label={label} onClick={() => void copy()}>
        {copied ? <Check className="text-success-fg" /> : <Copy />}
      </Button>
    </Tooltip>
  )
}
