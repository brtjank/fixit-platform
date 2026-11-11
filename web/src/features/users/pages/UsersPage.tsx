import { UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSession } from '@/features/auth'
import { errorMessage } from '@/shared/api'
import { useDebounce, usePagination } from '@/shared/hooks'
import { fullName, pluralize } from '@/shared/lib'
import type { User } from '@/shared/types'
import { Button, Card, EmptyState, ErrorState, MockBadge, PageHeader, Pagination } from '@/shared/ui'
import { DeactivateUserDialog } from '../components/DeactivateUserDialog'
import { EditUserDialog } from '../components/EditUserDialog'
import { InviteUserDialog } from '../components/InviteUserDialog'
import type { RoleFilterValue } from '../components/UserRoleFilter'
import { UsersTable } from '../components/UsersTable'
import { UsersToolbar, type StatusFilterValue } from '../components/UsersToolbar'
import { useSetUserActive, useUsers } from '../hooks'

export default function UsersPage() {
  const session = useSession()
  const { page, pageSize, setPage, setPageSize } = usePagination(20)
  const query = useUsers({ page, pageSize })
  const setActive = useSetUserActive()

  const [search, setSearch] = useState('')
  const [role, setRole] = useState<RoleFilterValue>('all')
  const [status, setStatus] = useState<StatusFilterValue>('all')
  const debouncedSearch = useDebounce(search.trim().toLowerCase(), 250)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [deactivating, setDeactivating] = useState<User | null>(null)

  const filtered = useMemo(() => {
    const items = query.data?.items ?? []
    return items.filter((u) => {
      if (role !== 'all' && u.role !== role) return false
      if (status === 'active' && !u.isActive) return false
      if (status === 'inactive' && u.isActive) return false
      if (!debouncedSearch) return true
      return fullName(u).toLowerCase().includes(debouncedSearch) || u.email.toLowerCase().includes(debouncedSearch)
    })
  }, [query.data, role, status, debouncedSearch])

  const hasFilters = debouncedSearch !== '' || role !== 'all' || status !== 'all'
  const clearFilters = () => {
    setSearch('')
    setRole('all')
    setStatus('all')
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="People in your organization"
        actions={
          <>
            <MockBadge />
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus /> Invite user
            </Button>
          </>
        }
      />

      {query.isError ? (
        <ErrorState title="Could not load users" message={errorMessage(query.error)} retry={() => void query.refetch()} />
      ) : (
        <Card>
          <UsersToolbar
            search={search}
            onSearchChange={setSearch}
            role={role}
            onRoleChange={setRole}
            status={status}
            onStatusChange={setStatus}
          />
          <div className="flex items-center justify-between px-4 py-2 text-xs text-fg-muted">
            <span className="tabular">
              {query.isLoading ? 'Loading…' : pluralize(filtered.length, 'user')}
              {hasFilters && query.data ? ` (filtered from ${query.data.items.length} on this page)` : null}
            </span>
            {hasFilters ? (
              <Button variant="link" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>

          {!query.isLoading && filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={hasFilters ? 'No users match your filters' : 'No users yet'}
              description={hasFilters ? 'Try a different search or filter. Filters apply to the current page.' : 'Invite people to your organization to get started.'}
              action={
                hasFilters ? (
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button onClick={() => setInviteOpen(true)}>
                    <UserPlus /> Invite user
                  </Button>
                )
              }
            />
          ) : (
            <UsersTable
              users={filtered}
              loading={query.isLoading}
              currentUserId={session?.userId}
              onEdit={setEditing}
              onDeactivate={setDeactivating}
              onActivate={(u) => setActive.mutate({ id: u.id, active: true })}
            />
          )}

          {query.data ? (
            <Pagination
              page={page}
              pageSize={pageSize}
              totalCount={query.data.totalCount}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          ) : null}
        </Card>
      )}

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <EditUserDialog user={editing} lockRole={editing?.id === session?.userId} onOpenChange={(o) => !o && setEditing(null)} />
      <DeactivateUserDialog user={deactivating} onOpenChange={(o) => !o && setDeactivating(null)} />
    </>
  )
}
