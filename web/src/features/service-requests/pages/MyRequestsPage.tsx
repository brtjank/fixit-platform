import { ClipboardList, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useSession } from '@/features/auth'
import { errorMessage } from '@/shared/api'
import { isClosedStatus } from '@/shared/lib'
import { ServiceRequestStatus } from '@/shared/types'
import { Badge, Button, EmptyState, ErrorState, MockBadge, PageHeader, Skeleton, Tabs, TabsList, TabsTrigger } from '@/shared/ui'
import { RequestCard } from '../components/RequestCard'
import { useServiceRequests } from '../hooks'

type Tab = 'open' | 'closed'

export default function MyRequestsPage() {
  const session = useSession()
  const [tab, setTab] = useState<Tab>('open')
  // Backend gap: no ?customerId filter and no Customer scoping → filter client-side (see docs/API_GAPS.md).
  const query = useServiceRequests({ pageSize: 100 })

  const mine = useMemo(
    () =>
      (query.data?.items ?? [])
        .filter((sr) => sr.customerId === session?.userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [query.data, session?.userId],
  )
  const open = mine.filter((sr) => !isClosedStatus(sr.status))
  const closed = mine.filter((sr) => isClosedStatus(sr.status))
  const visible = tab === 'open' ? open : closed

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            My requests <MockBadge label="Client-side filter" />
          </span>
        }
        description="Track everything you have asked us to fix."
        actions={
          <Button asChild>
            <Link to="/requests/new">
              <Plus /> New request
            </Link>
          </Button>
        }
      />

      {query.isError ? (
        <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : mine.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No requests yet"
          description="Something broken? Submit your first request and we will send a technician."
          action={
            <Button asChild>
              <Link to="/requests/new">
                <Plus /> Create your first request
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
              <TabsList>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <Badge tone="info">{open.length} open</Badge>
              <Badge tone="success">{closed.filter((sr) => sr.status === ServiceRequestStatus.Completed).length} completed</Badge>
            </div>
          </div>
          {visible.length === 0 ? (
            <EmptyState
              title={tab === 'open' ? 'Nothing open right now' : 'No closed requests yet'}
              description={tab === 'open' ? 'All your requests are closed. Need something else fixed?' : 'Completed and cancelled requests appear here.'}
              className="rounded-lg border border-dashed border-border"
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {visible.map((sr) => (
                <RequestCard key={sr.id} request={sr} workerLabel={sr.assignedWorkerId ? 'Technician assigned' : null} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
