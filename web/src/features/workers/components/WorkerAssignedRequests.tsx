import { ClipboardList } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useServiceRequests } from '@/features/service-requests/hooks'
import { useUserDirectory } from '@/features/users/hooks'
import { errorMessage } from '@/shared/api'
import { formatRelative, isClosedStatus, shortId } from '@/shared/lib'
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/shared/ui'

type TabValue = 'open' | 'closed'

export function WorkerAssignedRequests({ workerId }: { workerId: string }) {
  const { t } = useTranslation('workers')
  const navigate = useNavigate()
  const directory = useUserDirectory()
  const query = useServiceRequests({ assignedWorkerId: workerId, pageSize: 50 })
  const [tab, setTab] = useState<TabValue>('open')

  const { open, closed } = useMemo(() => {
    const items = [...(query.data?.items ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return { open: items.filter((r) => !isClosedStatus(r.status)), closed: items.filter((r) => isClosedStatus(r.status)) }
  }, [query.data])
  const rows = tab === 'open' ? open : closed
  const total = query.data?.totalCount ?? 0

  return (
    <Card>
      <CardHeader
        title={t('detail.assigned.title')}
        description={total > 50 ? t('detail.assigned.showingLatest', { total }) : undefined}
        actions={
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
            <TabsList>
              <TabsTrigger value="open">
                {t('detail.assigned.open')} <span className="text-xs text-fg-subtle tabular">{open.length}</span>
              </TabsTrigger>
              <TabsTrigger value="closed">
                {t('detail.assigned.closed')} <span className="text-xs text-fg-subtle tabular">{closed.length}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />
      {query.isError ? (
        <div className="p-5">
          <ErrorState title={t('detail.assigned.loadError')} message={errorMessage(query.error)} retry={() => void query.refetch()} />
        </div>
      ) : query.isLoading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={tab === 'open' ? t('detail.assigned.emptyOpenTitle') : t('detail.assigned.emptyClosedTitle')}
          description={tab === 'open' ? t('detail.assigned.emptyOpenDescription') : t('detail.assigned.emptyClosedDescription')}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('detail.assigned.reference')}</TableHead>
              <TableHead>{t('detail.assigned.requestTitle')}</TableHead>
              <TableHead>{t('detail.assigned.customer')}</TableHead>
              <TableHead>{t('detail.assigned.status')}</TableHead>
              <TableHead className="text-right">{t('detail.assigned.created')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow
                key={r.id}
                clickable
                tabIndex={0}
                onClick={() => navigate(`/requests/${r.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/requests/${r.id}`)
                }}
              >
                <TableCell className="whitespace-nowrap font-mono text-xs text-fg-muted">{shortId(r.id, 'SR')}</TableCell>
                <TableCell className="max-w-64 truncate font-medium text-fg">{r.title}</TableCell>
                <TableCell className="whitespace-nowrap text-fg-muted">{directory.label(r.customerId, 'CUST')}</TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-right text-xs text-fg-muted">{formatRelative(r.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}
