import { useState } from 'react'
import { useRole } from '@/features/auth'
import { cn, STATUS_META, shortId, type Tone } from '@/shared/lib'
import { ServiceRequestStatus, type ServiceRequest } from '@/shared/types'
import { Button, Dialog, DialogClose, DialogContent, FormField, StatusBadge, Textarea } from '@/shared/ui'
import { useChangeStatus } from '../hooks'
import { getRequestPermissions } from '../lib/permissions'
import { InlineError } from './InlineError'

const NOTES_MAX = 2000

const selectedTone: Record<Tone, string> = {
  neutral: 'border-neutral-fg/50 bg-neutral-soft',
  info: 'border-info-fg/50 bg-info-soft',
  warning: 'border-warning-fg/50 bg-warning-soft',
  success: 'border-success-fg/50 bg-success-soft',
  danger: 'border-danger-fg/50 bg-danger-soft',
  violet: 'border-violet-fg/50 bg-violet-soft',
  brand: 'border-brand bg-brand-soft',
}

interface Props {
  request: ServiceRequest
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangeStatusDialog({ request, open, onOpenChange }: Props) {
  return <Dialog open={open} onOpenChange={onOpenChange}>{open ? <ChangeStatusBody request={request} onDone={() => onOpenChange(false)} /> : null}</Dialog>
}

function ChangeStatusBody({ request, onDone }: { request: ServiceRequest; onDone: () => void }) {
  const role = useRole()
  const { transitions, statusReason } = getRequestPermissions(request, role)
  const change = useChangeStatus()
  const [status, setStatus] = useState<ServiceRequestStatus | null>(transitions[0] ?? null)
  const [notes, setNotes] = useState('')
  const isCancel = status === ServiceRequestStatus.Cancelled
  const tooLong = notes.length > NOTES_MAX

  const submit = () => {
    if (!status || tooLong) return
    change.mutate({ id: request.id, status, notes: notes.trim() || null }, { onSuccess: onDone })
  }

  return (
    <DialogContent
      title="Change status"
      description={
        <span className="inline-flex flex-wrap items-center gap-1.5">
          {shortId(request.id, 'SR')} · currently <StatusBadge status={request.status} />
        </span>
      }
      footer={
        <>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button variant={isCancel ? 'danger' : 'primary'} onClick={submit} disabled={!status || tooLong} loading={change.isPending}>
            {isCancel ? 'Cancel request' : status ? `Set to ${STATUS_META[status].label}` : 'Update status'}
          </Button>
        </>
      }
    >
      {transitions.length === 0 ? (
        <p className="text-sm text-fg-muted">{statusReason ?? 'No status changes are available.'}</p>
      ) : (
        <div className="space-y-4">
          <div role="radiogroup" aria-label="New status" className="grid gap-2">
            {transitions.map((s) => {
              const meta = STATUS_META[s]
              const active = status === s
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors',
                    active ? selectedTone[s === ServiceRequestStatus.Cancelled ? 'danger' : meta.tone] : 'border-border hover:bg-surface-hover',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-fg">{meta.label}</span>
                    <span className="block text-xs text-fg-muted">{meta.description}</span>
                  </span>
                  <StatusBadge status={s} />
                </button>
              )
            })}
          </div>
          {isCancel ? (
            <p className="rounded-md bg-danger-soft px-3 py-2 text-xs text-danger-fg">
              Cancelling is final — cancelled requests can no longer be changed.
            </p>
          ) : null}
          <FormField
            label="Notes"
            hint={<span className={cn('tabular', tooLong && 'text-danger-fg')}>Optional · {notes.length}/{NOTES_MAX}</span>}
            error={tooLong ? `Notes must not exceed ${NOTES_MAX} characters` : undefined}
          >
            {(field) => (
              <Textarea {...field} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What changed? Visible in the request history." rows={4} />
            )}
          </FormField>
        </div>
      )}
      <InlineError error={change.error} />
    </DialogContent>
  )
}
