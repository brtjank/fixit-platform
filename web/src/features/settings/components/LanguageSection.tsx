import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSegmented } from '@/shared/ui'
import { SectionHeading } from './SectionCard'

export function LanguageSection() {
  const { t } = useTranslation('settings')
  return (
    <section>
      <SectionHeading title={t('language.title')} description={t('language.description')} />
      <LanguageSegmented />
      <p className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
        <Info className="size-3.5 shrink-0" />
        {t('language.note')}
      </p>
    </section>
  )
}
