import { useNavigate } from 'react-router'
import { useUserDirectory } from '@/features/users/hooks'
import { formatDateTime, formatRelative, fullName, shortId } from '@/shared/lib'
import type { ServiceRequest } from '@/shared/types'
import { Avatar, Skeleton, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tooltip } from '@/shared/ui'
import { RequestRowActions } from './RequestRowActions'

interface Props {
  items: ServiceRequest[] | undefined
  loading: boolean
  onAssign: (request: ServiceRequest) => void
  onChangeStatus: (request: ServiceRequest) => void
}

export function RequestsTable({ items, loading, onAssign, onChangeStatus }: Props) {
  const navigate = useNavigate()
  const directory = useUserDirectory()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28">Reference</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Worker</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Actions</span>
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
                      <span className="text-fg-subtle">Unassigned</span>
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
