import { Construction } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState, PageHeader } from './index'

/** Temporary page body used while a screen is being built. */
export function Placeholder({ title }: { title: string }) {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={title} />
      <EmptyState icon={Construction} title={t('placeholder.underConstruction')} description={t('placeholder.notImplemented')} />
    </>
  )
}
