import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useUserDirectory } from '@/features/users/hooks'
import { cn, formatDateTime, formatRelative, fullName, shortId } from '@/shared/lib'
import type { ServiceRequest, ServiceRequestSortField, SortDirection } from '@/shared/types'
import { Avatar, Skeleton, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tooltip } from '@/shared/ui'
import { RequestRowActions } from './RequestRowActions'

interface Props {
  items: ServiceRequest[] | undefined
  loading: boolean
  onAssign: (request: ServiceRequest) => void
  onChangeStatus: (request: ServiceRequest) => void
  /** When set, Title / Status / Created headers become sort toggles (server-side sort). */
  sort?: SortState
}

interface SortState {
  field: ServiceRequestSortField
  direction: SortDirection
  onToggle: (field: ServiceRequestSortField) => void
}

function SortableHead({ field, label, sort }: { field: ServiceRequestSortField; label: string; sort?: SortState }) {
  const { t } = useTranslation('requests')
  if (!sort) return <TableHead>{label}</TableHead>
  const active = sort.field === field
  const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => sort.onToggle(field)}
        title={t('list.sort.sortBy', { column: label })}
        className={cn(
          '-mx-1 inline-flex items-center gap-1 rounded px-1 uppercase tracking-wide hover:text-fg',
          active && 'text-fg',
        )}
      >
        {label}
        <Icon className={cn('size-3.5', !active && 'opacity-50')} aria-hidden />
        {active ? <span className="sr-only">({t(sort.direction === 'asc' ? 'list.sort.ascending' : 'list.sort.descending')})</span> : null}
      </button>
    </TableHead>
  )
}

export function RequestsTable({ items, loading, onAssign, onChangeStatus, sort }: Props) {
  const { t } = useTranslation('requests')
  const navigate = useNavigate()
  const directory = useUserDirectory()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28">{t('list.columns.reference')}</TableHead>
          <SortableHead field="title" label={t('list.columns.title')} sort={sort} />
          <TableHead>{t('list.columns.customer')}</TableHead>
          <TableHead>{t('list.columns.worker')}</TableHead>
          <SortableHead field="status" label={t('list.columns.status')} sort={sort} />
          <SortableHead field="createdAt" label={t('list.columns.created')} sort={sort} />
          <TableHead className="w-12">
            <span className="sr-only">{t('list.columns.actions')}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading
          ? Array.from({ length: 8 }, (_, i) => (
              <TableRow key={i}>
                {[16, 56, 28, 32, 20, 20, 6].map((w, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4" style={{ width: `${w * 4}px` }} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : items?.map((sr) => {
              const worker = directory.getUser(sr.assignedWorkerId)
              return (
                <TableRow key={sr.id} clickable onClick={() => navigate(`/requests/${sr.id}`)}>
                  <TableCell className="font-mono text-xs text-fg-muted whitespace-nowrap">{shortId(sr.id, 'SR')}</TableCell>
                  <TableCell className="w-full max-w-0 min-w-56">
                    <div className="truncate font-medium text-fg">{sr.title}</div>
                    <div className="truncate text-xs text-fg-muted">{sr.description}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-fg-muted">{directory.label(sr.customerId, 'CUST')}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {sr.assignedWorkerId ? (
                      <span className="flex items-center gap-2">
                        <Avatar user={worker} size="xs" />
                        <span className="text-fg">{worker ? fullName(worker) : shortId(sr.assignedWorkerId, 'USR')}</span>
                      </span>
                    ) : (
                      <span className="text-fg-subtle">{t('shared.unassigned')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={sr.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-fg-muted">
                    <Tooltip content={formatDateTime(sr.createdAt)}>
                      <span>{formatRelative(sr.createdAt)}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right">
                    <RequestRowActions request={sr} onAssign={onAssign} onChangeStatus={onChangeStatus} />
                  </TableCell>
                </TableRow>
              )
            })}
      </TableBody>
    </Table>
  )
}
