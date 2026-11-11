import { ArrowRightLeft, UserPlus } from 'lucide-react'
import { Button } from '@/shared/ui'
import type { RequestPermissions } from '../lib/permissions'
import { DisabledReason } from './DisabledReason'

interface Props {
  perms: RequestPermissions
  onAssign: () => void
  onChangeStatus: () => void
}

/** Header actions on the detail page. Hidden for customers (view-only); disabled with a reason otherwise. */
export function RequestActionButtons({ perms, onAssign, onChangeStatus }: Props) {
  if (!perms.canManage) return null
  return (
    <>
      <DisabledReason reason={perms.assignReason}>
        <Button variant="secondary" onClick={onAssign} disabled={!perms.canAssign}>
          <UserPlus /> Assign worker
        </Button>
      </DisabledReason>
      <DisabledReason reason={perms.statusReason}>
        <Button onClick={onChangeStatus} disabled={!perms.canChangeStatus}>
          <ArrowRightLeft /> Change status
        </Button>
      </DisabledReason>
    </>
  )
}
