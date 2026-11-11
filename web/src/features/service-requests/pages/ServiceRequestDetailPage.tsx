import { ChevronRight, FileQuestion } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useRole } from '@/features/auth'
import { errorMessage, isApiError } from '@/shared/api'
import { formatDateTime, formatRelative, shortId } from '@/shared/lib'
import { UserRole } from '@/shared/types'
import { Button, Card, CardContent, CardHeader, EmptyState, ErrorState, PageHeader, PageSpinner, StatusBadge, Tooltip } from '@/shared/ui'
import { RequestActionButtons } from '../components/RequestActionButtons'
import { RequestDetailsCard } from '../components/RequestDetailsCard'
import { RequestPeopleCard } from '../components/RequestPeopleCard'
import { RequestTimeline } from '../components/RequestTimeline'
import { useRequestDialogs } from '../components/useRequestDialogs'
import { useServiceRequest } from '../hooks'
import { getRequestPermissions } from '../lib/permissions'

export default function ServiceRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const role = useRole()
  const query = useServiceRequest(id)
  const { openAssign, openStatus, dialogs } = useRequestDialogs()
  // Customers have no /requests list — their list lives on "/".
  const backTo = role === UserRole.Customer ? '/' : '/requests'

  if (query.isLoading) return <PageSpinner />

  if (query.isError || !query.data) {
    if (isApiError(query.error) && query.error.isNotFound) {
      return (
        <EmptyState
          icon={FileQuestion}
          title="Request not found"
          description="It may have been removed, or it belongs to another organization."
          action={
            <Button variant="secondary" asChild>
              <Link to={backTo}>Back to requests</Link>
            </Button>
          }
        />
      )
    }
    return <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />
  }

  const request = query.data
  const perms = getRequestPermissions(request, role)
  const ref = shortId(request.id, 'SR')

  return (
    <>
      <PageHeader
        breadcrumb={
          <nav aria-label="Breadcrumb" className="flex items-center gap-1">
            <Link to={backTo} className="hover:text-fg">
              {role === UserRole.Customer ? 'My requests' : 'Requests'}
            </Link>
            <ChevronRight className="size-3" />
            <span className="font-mono text-fg-muted">{ref}</span>
          </nav>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="break-words">{request.title}</span>
            <StatusBadge status={request.status} className="text-sm" />
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-2">
            <span className="font-mono text-xs">{ref}</span>
            <span aria-hidden>·</span>
            <Tooltip content={formatDateTime(request.createdAt)}>
              <span>Created {formatRelative(request.createdAt)}</span>
            </Tooltip>
          </span>
        }
        actions={<RequestActionButtons perms={perms} onAssign={() => openAssign(request)} onChangeStatus={() => openStatus(request)} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Description" />
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-fg">{request.description}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Latest notes" description="From the most recent status change" />
            <CardContent>
              {request.notes ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-fg">{request.notes}</p>
              ) : (
                <p className="text-sm text-fg-subtle">No notes yet.</p>
              )}
            </CardContent>
          </Card>
          <RequestTimeline request={request} />
        </div>
        <div className="space-y-6">
          <RequestPeopleCard request={request} canAssign={perms.canAssign} onAssign={() => openAssign(request)} />
          <RequestDetailsCard request={request} />
        </div>
      </div>
      {dialogs}
    </>
  )
}
