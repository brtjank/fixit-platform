import { Inbox, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { useIsAdmin } from '@/features/auth'
import { errorMessage } from '@/shared/api'
import { usePagination } from '@/shared/hooks'
import { pluralize } from '@/shared/lib'
import { Button, Card, EmptyState, ErrorState, PageHeader, Pagination } from '@/shared/ui'
import { RequestFilterBar } from '../components/RequestFilterBar'
import { RequestsTable } from '../components/RequestsTable'
import { useRequestDialogs } from '../components/useRequestDialogs'
import { useRequestFilters } from '../components/useRequestFilters'
import { useServiceRequests } from '../hooks'

export default function ServiceRequestsListPage() {
  const isAdmin = useIsAdmin()
  const { page, pageSize, setPage, setPageSize } = usePagination(20)
  const filters = useRequestFilters()
  const { openAssign, openStatus, dialogs } = useRequestDialogs()

  const query = useServiceRequests({
    page,
    pageSize,
    status: filters.status,
    assignedWorkerId: filters.assignedWorkerId || undefined,
  })

  const items = useMemo(() => {
    const all = query.data?.items ?? []
    const term = filters.q.trim().toLowerCase()
    return term ? all.filter((sr) => sr.title.toLowerCase().includes(term)) : all
  }, [query.data, filters.q])

  const total = query.data?.totalCount

  return (
    <>
      <PageHeader
        title="Service requests"
        description={total !== undefined ? pluralize(total, 'request') : 'Loading…'}
        actions={
          isAdmin ? (
            <Button asChild>
              <Link to="/requests/new">
                <Plus /> New request
              </Link>
            </Button>
          ) : null
        }
      />
      <Card className="overflow-hidden">
        <RequestFilterBar filters={filters} />
        {query.isError ? (
          <div className="p-4">
            <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />
          </div>
        ) : !query.isLoading && items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No requests match these filters"
            description={filters.hasFilters ? 'Try a different status, worker or search term.' : 'There are no service requests yet.'}
            action={
              filters.hasFilters ? (
                <Button variant="secondary" onClick={filters.clear}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        ) : (
          <div className={query.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
            <RequestsTable items={items} loading={query.isLoading} onAssign={openAssign} onChangeStatus={openStatus} />
          </div>
        )}
        {total !== undefined && total > 0 ? (
          <Pagination page={page} pageSize={pageSize} totalCount={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
        ) : null}
      </Card>
      {dialogs}
    </>
  )
}
