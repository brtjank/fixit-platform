import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRole } from '@/features/auth'
import { cn, STATUS_META, shortId, statusDescription, statusLabel, type Tone } from '@/shared/lib'
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
  const { t } = useTranslation('requests')
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
      title={t('dialogs.status.title')}
      description={
        <span className="inline-flex flex-wrap items-center gap-1.5">
          {shortId(request.id, 'SR')} · {t('dialogs.status.currently')} <StatusBadge status={request.status} />
        </span>
      }
      footer={
        <>
          <DialogClose asChild>
            <Button variant="secondary">{t('common:actions.cancel')}</Button>
          </DialogClose>
          <Button variant={isCancel ? 'danger' : 'primary'} onClick={submit} disabled={!status || tooLong} loading={change.isPending}>
            {isCancel
              ? t('dialogs.status.cancelRequest')
              : status
                ? t('dialogs.status.setTo', { status: statusLabel(status) })
                : t('dialogs.status.submit')}
          </Button>
        </>
      }
    >
      {transitions.length === 0 ? (
        <p className="text-sm text-fg-muted">{statusReason ?? t('dialogs.status.noTransitions')}</p>
      ) : (
        <div className="space-y-4">
          <div role="radiogroup" aria-label={t('dialogs.status.newStatus')} className="grid gap-2">
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
                    <span className="block text-sm font-medium text-fg">{statusLabel(s)}</span>
                    <span className="block text-xs text-fg-muted">{statusDescription(s)}</span>
                  </span>
                  <StatusBadge status={s} />
                </button>
              )
            })}
          </div>
          {isCancel ? (
            <p className="rounded-md bg-danger-soft px-3 py-2 text-xs text-danger-fg">
              {t('dialogs.status.cancelWarning')}
            </p>
          ) : null}
          <FormField
            label={t('dialogs.status.notesLabel')}
            hint={<span className={cn('tabular', tooLong && 'text-danger-fg')}>{t('dialogs.status.notesHint', { length: notes.length, max: NOTES_MAX })}</span>}
            error={tooLong ? t('dialogs.status.notesTooLong', { max: NOTES_MAX }) : undefined}
          >
            {(field) => (
              <Textarea {...field} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('dialogs.status.notesPlaceholder')} rows={4} />
            )}
          </FormField>
        </div>
      )}
      <InlineError error={change.error} />
    </DialogContent>
  )
}
