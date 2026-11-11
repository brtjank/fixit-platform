import { UserPlus } from 'lucide-react'
import type { ReactNode } from 'react'
import { useRole } from '@/features/auth'
import { useUser } from '@/features/users/hooks'
import { useWorkerProfiles } from '@/features/workers/hooks'
import { fullName, shortId } from '@/shared/lib'
import { UserRole, type ServiceRequest, type User } from '@/shared/types'
import { Avatar, Button, Card, CardContent, CardHeader, Skeleton } from '@/shared/ui'
import { AvailabilityDot } from './AvailabilityDot'

function Person({ title, user, loading, fallbackId, prefix, extra }: {
  title: string
  user: User | undefined
  loading: boolean
  fallbackId: string
  prefix: string
  extra?: ReactNode
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">{title}</div>
      {loading ? (
        <Skeleton className="h-10" />
      ) : (
        <div className="flex items-center gap-3">
          <Avatar user={user} />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-fg">{user ? fullName(user) : shortId(fallbackId, prefix)}</div>
            {user ? <div className="truncate text-xs text-fg-muted">{user.email}</div> : null}
            {extra}
          </div>
        </div>
      )}
    </div>
  )
}

export function RequestPeopleCard({ request, canAssign, onAssign }: { request: ServiceRequest; canAssign: boolean; onAssign: () => void }) {
  const role = useRole()
  const isStaff = role === UserRole.Admin || role === UserRole.Worker
  // ⚠ GET /api/users/{id} is mock-only; it is the only way a Customer can resolve names.
  const customer = useUser(request.customerId)
  const worker = useUser(request.assignedWorkerId ?? undefined)
  const profiles = useWorkerProfiles({ enabled: isStaff && Boolean(request.assignedWorkerId) })
  const profile = profiles.data?.find((p) => p.userId === request.assignedWorkerId)

  return (
    <Card>
      <CardHeader title="People" />
      <CardContent className="space-y-5">
        <Person title="Customer" user={customer.data} loading={customer.isLoading} fallbackId={request.customerId} prefix="CUST" />
        {request.assignedWorkerId ? (
          <Person
            title="Assigned worker"
            user={worker.data}
            loading={worker.isLoading}
            fallbackId={request.assignedWorkerId}
            prefix="USR"
            extra={
              profile ? (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-fg-muted">
                  <AvailabilityDot available={profile.isAvailable} />
                  {profile.specialization ?? 'General'} · {profile.isAvailable ? 'Available' : 'Unavailable'}
                </div>
              ) : null
            }
          />
        ) : (
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">Assigned worker</div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border-strong px-3 py-2.5">
              <span className="text-sm text-fg-muted">Unassigned</span>
              {canAssign ? (
                <Button size="sm" variant="soft" onClick={onAssign}>
                  <UserPlus /> Assign
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
