import { Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Button, EmptyState } from '@/shared/ui'

export default function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <EmptyState
      icon={Compass}
      title={t('errors.notFoundTitle')}
      description={t('errors.notFoundDescription')}
      action={
        <Button asChild variant="secondary">
          <Link to="/">{t('actions.backHome')}</Link>
        </Button>
      }
      className="mt-16"
    />
  )
}
