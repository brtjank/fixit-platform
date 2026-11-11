import { Briefcase } from 'lucide-react'
import { useMemo } from 'react'
import { useRole, useSession } from '@/features/auth'
import { useUserDirectory } from '@/features/users/hooks'
import { errorMessage } from '@/shared/api'
import { cn, isClosedStatus, pluralize } from '@/shared/lib'
import { ServiceRequestStatus, type ServiceRequest } from '@/shared/types'
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@/shared/ui'
import { AssignmentCard } from '../components/AssignmentCard'
import { useRequestDialogs } from '../components/useRequestDialogs'
import { useServiceRequests } from '../hooks'
import { getRequestPermissions } from '../lib/permissions'

const COLUMNS = [
  { key: 'assigned', title: 'Assigned', dot: 'bg-info-fg', match: (s: ServiceRequestStatus) => s === ServiceRequestStatus.Assigned || s === ServiceRequestStatus.Pending },
  { key: 'progress', title: 'In progress', dot: 'bg-violet-fg', match: (s: ServiceRequestStatus) => s === ServiceRequestStatus.InProgress },
  { key: 'done', title: 'Done', dot: 'bg-success-fg', match: (s: ServiceRequestStatus) => isClosedStatus(s) },
] as const

export default function MyAssignmentsPage() {
  const session = useSession()
  const role = useRole()
  const directory = useUserDirectory()
  const { openStatus, dialogs } = useRequestDialogs()
  const query = useServiceRequests({ assignedWorkerId: session?.userId, pageSize: 100 }, { enabled: Boolean(session?.userId) })

  const columns = useMemo(() => {
    const items = [...(query.data?.items ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return COLUMNS.map((c) => ({ ...c, items: items.filter((sr) => c.match(sr.status)) }))
  }, [query.data])

  const total = query.data?.items.length ?? 0
  const openCount = columns[0].items.length + columns[1].items.length

  return (
    <>
      <PageHeader
        title="My assignments"
        description={query.data ? `${pluralize(openCount, 'open job')} · ${pluralize(total, 'assignment')} in total` : 'Requests assigned to you'}
      />
      {query.isError ? (
        <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />
      ) : !query.isLoading && total === 0 ? (
        <EmptyState icon={Briefcase} title="No assignments yet" description="Requests assigned to you will show up here." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {columns.map((col) => (
            <section key={col.key} className="flex min-w-0 flex-col rounded-xl border border-border bg-bg-subtle p-3">
              <header className="mb-3 flex items-center gap-2 px-1">
                <span className={cn('size-2 rounded-full', col.dot)} aria-hidden />
                <h2 className="text-sm font-semibold text-fg">{col.title}</h2>
                <span className="ml-auto rounded-full bg-surface px-2 text-xs text-fg-muted tabular">
                  {query.isLoading ? '–' : col.items.length}
                </span>
              </header>
              <div className="space-y-2.5">
                {query.isLoading ? (
                  Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
                ) : col.items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border-strong px-3 py-6 text-center text-xs text-fg-subtle">
                    Nothing here
                  </p>
                ) : (
                  col.items.map((sr: ServiceRequest) => (
                    <AssignmentCard
                      key={sr.id}
                      request={sr}
                      customerLabel={directory.label(sr.customerId, 'CUST')}
                      canUpdate={getRequestPermissions(sr, role).canChangeStatus}
                      onUpdateStatus={openStatus}
                    />
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}
      {dialogs}
    </>
  )
}
