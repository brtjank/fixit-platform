import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Tooltip } from '@/shared/ui'

export function CopyButton({ value, label: labelProp }: { value: string; label?: string }) {
  const { t } = useTranslation('requests')
  const label = labelProp ?? t('shared.copy')
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
    <Tooltip content={copied ? t('shared.copied') : label}>
      <Button variant="ghost" size="icon-sm" className="size-7" aria-label={label} onClick={() => void copy()}>
        {copied ? <Check className="text-success-fg" /> : <Copy />}
      </Button>
    </Tooltip>
  )
}
