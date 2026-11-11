import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { useIsCustomer } from '@/features/auth'
import { ServiceRequestStatus } from '@/shared/types'
import { Card, CardContent, CardHeader, PageHeader, StatusBadge } from '@/shared/ui'
import { NewRequestForm } from '../components/NewRequestForm'

const FLOW = [
  { status: ServiceRequestStatus.Pending, text: 'Your request is received and waits in the queue.' },
  { status: ServiceRequestStatus.Assigned, text: 'A technician is assigned to it.' },
  { status: ServiceRequestStatus.InProgress, text: 'The technician is working on it.' },
  { status: ServiceRequestStatus.Completed, text: 'Work is done — the request is closed.' },
]

export default function NewServiceRequestPage() {
  const isCustomer = useIsCustomer()
  const backTo = isCustomer ? '/' : '/requests'

  return (
    <>
      <PageHeader
        breadcrumb={
          <nav aria-label="Breadcrumb" className="flex items-center gap-1">
            <Link to={backTo} className="hover:text-fg">
              {isCustomer ? 'My requests' : 'Requests'}
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-fg-muted">New</span>
          </nav>
        }
        title="New service request"
        description="Tell us what needs fixing — we will take it from there."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <NewRequestForm />
        <Card className="h-fit">
          <CardHeader title="What happens next" />
          <CardContent>
            <ol className="space-y-4">
              {FLOW.map((step, i) => (
                <li key={step.status} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-bg-subtle text-xs font-semibold text-fg-muted tabular">
                    {i + 1}
                  </span>
                  <div className="space-y-1">
                    <StatusBadge status={step.status} />
                    <p className="text-xs text-fg-muted">{step.text}</p>
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
