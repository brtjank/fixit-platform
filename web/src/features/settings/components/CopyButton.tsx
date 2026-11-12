import { Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/shared/ui'

export function CopyButton({ value, label: labelProp, iconOnly }: { value: string; label?: string; iconOnly?: boolean }) {
  const { t } = useTranslation('settings')
  const label = labelProp ?? t('copy.label')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(t('common:actions.copied'))
    } catch {
      toast.error(t('copy.failed'))
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
