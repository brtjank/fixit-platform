import { fullName } from '@/shared/lib'
import type { User } from '@/shared/types'
import { Button, Dialog, DialogClose, DialogContent, MockBadge } from '@/shared/ui'
import { useSetUserActive } from '../hooks'

interface DeactivateUserDialogProps {
  user: User | null
  onOpenChange: (open: boolean) => void
}

export function DeactivateUserDialog({ user, onOpenChange }: DeactivateUserDialogProps) {
  const setActive = useSetUserActive()
  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      {user ? (
        <DialogContent
          size="sm"
          title={
            <span className="inline-flex items-center gap-2">
              Deactivate {fullName(user)}? <MockBadge />
            </span>
          }
          description="They will no longer be able to sign in or be assigned to requests. You can reactivate them at any time."
          footer={
            <>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                variant="danger"
                loading={setActive.isPending}
                onClick={() => setActive.mutate({ id: user.id, active: false }, { onSuccess: () => onOpenChange(false) })}
              >
                Deactivate
              </Button>
            </>
          }
        >
          <p className="text-sm text-fg-muted">
            Account: <span className="font-medium text-fg">{user.email}</span>
          </p>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
