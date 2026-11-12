import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useIsCustomer } from '@/features/auth'
import { ServiceRequestStatus } from '@/shared/types'
import { Card, CardContent, CardHeader, PageHeader, StatusBadge } from '@/shared/ui'
import { NewRequestForm } from '../components/NewRequestForm'

const FLOW = [
  { status: ServiceRequestStatus.Pending, textKey: 'new.next.pending' },
  { status: ServiceRequestStatus.Assigned, textKey: 'new.next.assigned' },
  { status: ServiceRequestStatus.InProgress, textKey: 'new.next.inProgress' },
  { status: ServiceRequestStatus.Completed, textKey: 'new.next.completed' },
]

export default function NewServiceRequestPage() {
  const { t } = useTranslation('requests')
  const isCustomer = useIsCustomer()
  const backTo = isCustomer ? '/' : '/requests'

  return (
    <>
      <PageHeader
        breadcrumb={
          <nav aria-label={t('breadcrumb')} className="flex items-center gap-1">
            <Link to={backTo} className="hover:text-fg">
              {isCustomer ? t('shared.myRequests') : t('shared.requests')}
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-fg-muted">{t('new.breadcrumb')}</span>
          </nav>
        }
        title={t('new.title')}
        description={t('new.description')}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <NewRequestForm />
        <Card className="h-fit">
          <CardHeader title={t('new.next.title')} />
          <CardContent>
            <ol className="space-y-4">
              {FLOW.map((step, i) => (
                <li key={step.status} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-bg-subtle text-xs font-semibold text-fg-muted tabular">
                    {i + 1}
                  </span>
                  <div className="space-y-1">
                    <StatusBadge status={step.status} />
                    <p className="text-xs text-fg-muted">{t(step.textKey)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
