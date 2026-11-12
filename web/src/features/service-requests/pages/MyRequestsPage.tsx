import { ClipboardList, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('requests')
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
            {t('my.title')} <MockBadge label={t('my.clientSideFilter')} />
          </span>
        }
        description={t('my.description')}
        actions={
          <Button asChild>
            <Link to="/requests/new">
              <Plus /> {t('shared.newRequest')}
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
          title={t('my.empty.title')}
          description={t('my.empty.description')}
          action={
            <Button asChild>
              <Link to="/requests/new">
                <Plus /> {t('my.empty.action')}
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
              <TabsList>
                <TabsTrigger value="open">{t('my.tabs.open')}</TabsTrigger>
                <TabsTrigger value="closed">{t('my.tabs.closed')}</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <Badge tone="info">{t('my.openCount', { count: open.length })}</Badge>
              <Badge tone="success">
                {t('my.completedCount', { count: closed.filter((sr) => sr.status === ServiceRequestStatus.Completed).length })}
              </Badge>
            </div>
          </div>
          {visible.length === 0 ? (
            <EmptyState
              title={tab === 'open' ? t('my.emptyOpen.title') : t('my.emptyClosed.title')}
              description={tab === 'open' ? t('my.emptyOpen.description') : t('my.emptyClosed.description')}
              className="rounded-lg border border-dashed border-border"
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {visible.map((sr) => (
                <RequestCard key={sr.id} request={sr} workerLabel={sr.assignedWorkerId ? t('my.technicianAssigned') : null} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
