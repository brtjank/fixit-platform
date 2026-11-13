import { Check, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkers } from '@/features/users/hooks'
import { useWorkerProfiles } from '@/features/workers/hooks'
import { cn, fullName, shortId } from '@/shared/lib'
import type { ServiceRequest } from '@/shared/types'
import { Avatar, Button, Dialog, DialogClose, DialogContent, EmptyState, ErrorState, Skeleton } from '@/shared/ui'
import { useAssignWorker } from '../hooks'
import { AvailabilityDot } from './AvailabilityDot'
import { InlineError } from './InlineError'

interface Props {
  request: ServiceRequest
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignWorkerDialog({ request, open, onOpenChange }: Props) {
  return <Dialog open={open} onOpenChange={onOpenChange}>{open ? <AssignWorkerBody request={request} onDone={() => onOpenChange(false)} /> : null}</Dialog>
}

function AssignWorkerBody({ request, onDone }: { request: ServiceRequest; onDone: () => void }) {
  const { t } = useTranslation('requests')
  const workersQuery = useWorkers()
  const profilesQuery = useWorkerProfiles()
  const assign = useAssignWorker()
  const [selected, setSelected] = useState<string | null>(request.assignedWorkerId)

  const rows = useMemo(() => {
    const profiles = new Map((profilesQuery.data ?? []).map((p) => [p.userId, p]))
    return (workersQuery.data?.items ?? [])
      .filter((w) => w.isActive)
      .map((w) => {
        const profile = profiles.get(w.id)
        return { user: w, specialization: profile?.specialization ?? null, available: profile?.isAvailable ?? true }
      })
      .sort((a, b) => Number(b.available) - Number(a.available) || fullName(a.user).localeCompare(fullName(b.user)))
  }, [workersQuery.data, profilesQuery.data])

  const submit = () => {
    if (!selected) return
    assign.mutate({ id: request.id, workerId: selected }, { onSuccess: onDone })
  }

  return (
    <DialogContent
      title={t('dialogs.assign.title')}
      description={`${shortId(request.id, 'SR')} · ${request.title}`}
      footer={
        <>
          <DialogClose asChild>
            <Button variant="secondary">{t('common:actions.cancel')}</Button>
          </DialogClose>
          <Button onClick={submit} disabled={!selected} loading={assign.isPending}>
            {t('dialogs.assign.submit')}
          </Button>
        </>
      }
    >
      <div className="mb-2 flex items-center justify-between text-xs text-fg-subtle">
        <span>{t('dialogs.assign.selectWorker')}</span>
      </div>
      {workersQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : workersQuery.isError ? (
        <ErrorState message={t('dialogs.assign.loadError')} retry={() => void workersQuery.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title={t('dialogs.assign.emptyTitle')} description={t('dialogs.assign.emptyDescription')} className="py-8" />
      ) : (
        <div role="radiogroup" aria-label={t('dialogs.assign.workers')} className="space-y-1.5">
          {rows.map(({ user, specialization, available }) => {
            const active = selected === user.id
            return (
              <button
                key={user.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(user.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                  active ? 'border-brand bg-brand-soft' : 'border-border hover:bg-surface-hover',
                  !available && !active && 'opacity-60',
                )}
              >
                <Avatar user={user} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">{fullName(user)}</span>
                  <span className="block truncate text-xs text-fg-muted">{specialization ?? t('shared.general')}</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
                  <AvailabilityDot available={available} />
                  {available ? t('shared.available') : t('shared.unavailable')}
                </span>
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full border',
                    active ? 'border-brand bg-brand text-fg-on-brand' : 'border-border-strong',
                  )}
                  aria-hidden
                >
                  {active ? <Check className="size-3" /> : null}
                </span>
              </button>
            )
          })}
        </div>
      )}
      <InlineError error={assign.error} />
    </DialogContent>
  )
}
