import { HardHat, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useIsAdmin } from '@/features/auth'
import { errorMessage } from '@/shared/api'
import { useDebounce } from '@/shared/hooks'
import { fullName } from '@/shared/lib'
import { Button, EmptyState, ErrorState, PageHeader } from '@/shared/ui'
import { WorkerCard, WorkerCardSkeleton } from '../components/WorkerCard'
import { WorkersSummary } from '../components/WorkersSummary'
import { WorkersToolbar } from '../components/WorkersToolbar'
import { useWorkerRoster } from '../hooks'
import { isWorkerAvailable } from '../lib'

export default function WorkersPage() {
  const isAdmin = useIsAdmin()
  const navigate = useNavigate()
  const { entries, workersQuery, extrasLoading } = useWorkerRoster()

  const [search, setSearch] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [specialization, setSpecialization] = useState('')
  const q = useDebounce(search.trim().toLowerCase(), 250)

  const specializations = useMemo(
    () => [...new Set(entries.map((e) => e.profile?.specialization).filter((s): s is string => Boolean(s)))].sort(),
    [entries],
  )

  const filtered = useMemo(
    () =>
      entries.filter(({ user, profile }) => {
        if (availableOnly && !isWorkerAvailable(user, profile)) return false
        if (specialization && profile?.specialization !== specialization) return false
        if (!q) return true
        return fullName(user).toLowerCase().includes(q) || (profile?.specialization ?? '').toLowerCase().includes(q)
      }),
    [entries, availableOnly, specialization, q],
  )

  const summary = useMemo(
    () => ({
      total: entries.length,
      available: entries.filter((e) => isWorkerAvailable(e.user, e.profile)).length,
      busy: entries.filter((e) => e.user.isActive && (e.workload?.open ?? 0) > 0).length,
    }),
    [entries],
  )

  const hasFilters = q !== '' || availableOnly || specialization !== ''
  const clear = () => {
    setSearch('')
    setAvailableOnly(false)
    setSpecialization('')
  }

  return (
    <>
      <PageHeader
        title="Workers"
        description="Field technicians, their specializations and current workload"
        actions={
          isAdmin ? (
            <Button onClick={() => navigate('/users')}>
              <UserPlus /> Invite worker
            </Button>
          ) : undefined
        }
      />

      {workersQuery.isError ? (
        <ErrorState title="Could not load workers" message={errorMessage(workersQuery.error)} retry={() => void workersQuery.refetch()} />
      ) : (
        <>
          <WorkersSummary {...summary} loading={workersQuery.isLoading || extrasLoading} />
          <WorkersToolbar
            search={search}
            onSearchChange={setSearch}
            availableOnly={availableOnly}
            onAvailableOnlyChange={setAvailableOnly}
            specialization={specialization}
            onSpecializationChange={setSpecialization}
            specializations={specializations}
          />

          {workersQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <WorkerCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={HardHat}
              title={hasFilters ? 'No workers match your filters' : 'No workers yet'}
              description={hasFilters ? 'Try a different search or clear the filters.' : 'Invite workers so they can be assigned to service requests.'}
              action={
                hasFilters ? (
                  <Button variant="secondary" onClick={clear}>
                    Clear filters
                  </Button>
                ) : isAdmin ? (
                  <Button onClick={() => navigate('/users')}>
                    <UserPlus /> Invite worker
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((entry) => (
                <WorkerCard key={entry.user.id} entry={entry} extrasLoading={extrasLoading} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
