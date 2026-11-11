import { formatDate, fullName } from '@/shared/lib'
import type { User } from '@/shared/types'
import { Avatar, Badge, RoleBadge, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui'
import { UserRowActions } from './UserRowActions'

interface UsersTableProps {
  users: User[]
  loading?: boolean
  currentUserId: string | undefined
  onEdit: (user: User) => void
  onDeactivate: (user: User) => void
  onActivate: (user: User) => void
}

export function UsersTable({ users, loading, currentUserId, ...actions }: UsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading
          ? Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} />)
          : users.map((user) => {
              const isSelf = user.id === currentUserId
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar user={user} size="sm" />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-fg">
                          {fullName(user)}
                          {isSelf ? <span className="ml-1.5 text-xs font-normal text-fg-subtle">(you)</span> : null}
                        </div>
                        <div className="truncate text-xs text-fg-muted">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge tone="success" dot>
                        Active
                      </Badge>
                    ) : (
                      <Badge tone="neutral" dot>
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-fg-muted tabular">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <UserRowActions user={user} isSelf={isSelf} {...actions} />
                  </TableCell>
                </TableRow>
              )
            })}
      </TableBody>
    </Table>
  )
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="size-7 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-14 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-3.5 w-20" />
      </TableCell>
      <TableCell />
    </TableRow>
  )
}
