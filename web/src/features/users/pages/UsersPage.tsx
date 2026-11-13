import { UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from '@/features/auth'
import { errorMessage } from '@/shared/api'
import { useDebounce, usePagination } from '@/shared/hooks'
import { fullName } from '@/shared/lib'
import type { User } from '@/shared/types'
import { Button, Card, EmptyState, ErrorState, PageHeader, Pagination } from '@/shared/ui'
import { DeactivateUserDialog } from '../components/DeactivateUserDialog'
import { EditUserDialog } from '../components/EditUserDialog'
import { InviteUserDialog } from '../components/InviteUserDialog'
import { ResetPasswordDialog } from '../components/ResetPasswordDialog'
import type { RoleFilterValue } from '../components/UserRoleFilter'
import { UsersTable } from '../components/UsersTable'
import { UsersToolbar, type StatusFilterValue } from '../components/UsersToolbar'
import { useSetUserActive, useUsers } from '../hooks'

export default function UsersPage() {
  const { t } = useTranslation('users')
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
  const [resettingPassword, setResettingPassword] = useState<User | null>(null)

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
        title={t('list.title')}
        description={t('list.description')}
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus /> {t('actions.invite')}
          </Button>
        }
      />

      {query.isError ? (
        <ErrorState title={t('list.loadError')} message={errorMessage(query.error)} retry={() => void query.refetch()} />
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
              {query.isLoading ? t('list.loading') : t('list.count', { count: filtered.length })}
              {hasFilters && query.data ? t('list.filteredFrom', { total: query.data.items.length }) : null}
            </span>
            {hasFilters ? (
              <Button variant="link" size="sm" onClick={clearFilters}>
                {t('common:actions.clearFilters')}
              </Button>
            ) : null}
          </div>

          {!query.isLoading && filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={hasFilters ? t('list.emptyFilteredTitle') : t('list.emptyTitle')}
              description={hasFilters ? t('list.emptyFilteredDescription') : t('list.emptyDescription')}
              action={
                hasFilters ? (
                  <Button variant="secondary" onClick={clearFilters}>
                    {t('common:actions.clearFilters')}
                  </Button>
                ) : (
                  <Button onClick={() => setInviteOpen(true)}>
                    <UserPlus /> {t('actions.invite')}
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
              onResetPassword={setResettingPassword}
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
      <ResetPasswordDialog user={resettingPassword} onOpenChange={(o) => !o && setResettingPassword(null)} />
    </>
  )
}
