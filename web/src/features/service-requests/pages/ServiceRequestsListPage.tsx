import { Inbox, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useIsAdmin } from '@/features/auth'
import { errorMessage } from '@/shared/api'
import { usePagination } from '@/shared/hooks'
import { DEFAULT_SERVICE_REQUEST_SORT } from '@/shared/types'
import { Button, Card, EmptyState, ErrorState, PageHeader, Pagination } from '@/shared/ui'
import { RequestFilterBar } from '../components/RequestFilterBar'
import { RequestsTable } from '../components/RequestsTable'
import { useRequestDialogs } from '../components/useRequestDialogs'
import { useRequestFilters } from '../components/useRequestFilters'
import { useServiceRequests } from '../hooks'

export default function ServiceRequestsListPage() {
  const { t } = useTranslation('requests')
  const isAdmin = useIsAdmin()
  const { page, pageSize, setPage, setPageSize } = usePagination(20)
  const filters = useRequestFilters()
  const { openAssign, openStatus, dialogs } = useRequestDialogs()

  const query = useServiceRequests({
    page,
    pageSize,
    status: filters.status,
    assignedWorkerId: filters.assignedWorkerId || undefined,
    search: filters.q || undefined,
    // Default sort is left implicit (backend default createdAt:desc) so the query key stays stable.
    sort: filters.sort === DEFAULT_SERVICE_REQUEST_SORT ? undefined : filters.sort,
  })

  const items = query.data?.items ?? []

  const total = query.data?.totalCount

  return (
    <>
      <PageHeader
        title={t('list.title')}
        description={total !== undefined ? t('list.count', { count: total }) : t('list.loading')}
        actions={
          isAdmin ? (
            <Button asChild>
              <Link to="/requests/new">
                <Plus /> {t('shared.newRequest')}
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
            title={t('list.empty.title')}
            description={filters.hasFilters ? t('list.empty.filtered') : t('list.empty.none')}
            action={
              filters.hasFilters ? (
                <Button variant="secondary" onClick={filters.clear}>
                  {t('common:actions.clearFilters')}
                </Button>
              ) : null
            }
          />
        ) : (
          <div className={query.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
            <RequestsTable
              items={items}
              loading={query.isLoading}
              onAssign={openAssign}
              onChangeStatus={openStatus}
              sort={{ field: filters.sortField, direction: filters.sortDirection, onToggle: filters.toggleSort }}
            />
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
