import { useCallback, useState } from 'react'
import type { ServiceRequest } from '@/shared/types'
import { AssignWorkerDialog } from './AssignWorkerDialog'
import { ChangeStatusDialog } from './ChangeStatusDialog'

type DialogState = { kind: 'assign' | 'status'; request: ServiceRequest } | null

/** One pair of dialogs per page, opened for any request (lists, kanban, detail). */
export function useRequestDialogs() {
  const [state, setState] = useState<DialogState>(null)
  const openAssign = useCallback((request: ServiceRequest) => setState({ kind: 'assign', request }), [])
  const openStatus = useCallback((request: ServiceRequest) => setState({ kind: 'status', request }), [])
  const close = (open: boolean) => {
    if (!open) setState(null)
  }

  const dialogs = state ? (
    state.kind === 'assign' ? (
      <AssignWorkerDialog request={state.request} open onOpenChange={close} />
    ) : (
      <ChangeStatusDialog request={state.request} open onOpenChange={close} />
    )
  ) : null

  return { openAssign, openStatus, dialogs }
}
