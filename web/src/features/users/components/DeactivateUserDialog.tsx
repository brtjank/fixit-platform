import { useTranslation } from 'react-i18next'
import { fullName } from '@/shared/lib'
import type { User } from '@/shared/types'
import { Button, Dialog, DialogClose, DialogContent, MockBadge } from '@/shared/ui'
import { useSetUserActive } from '../hooks'

interface DeactivateUserDialogProps {
  user: User | null
  onOpenChange: (open: boolean) => void
}

export function DeactivateUserDialog({ user, onOpenChange }: DeactivateUserDialogProps) {
  const { t } = useTranslation('users')
  const setActive = useSetUserActive()
  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      {user ? (
        <DialogContent
          size="sm"
          title={
            <span className="inline-flex items-center gap-2">
              {t('deactivate.title', { name: fullName(user) })} <MockBadge />
            </span>
          }
          description={t('deactivate.description')}
          footer={
            <>
              <DialogClose asChild>
                <Button variant="secondary">{t('common:actions.cancel')}</Button>
              </DialogClose>
              <Button
                variant="danger"
                loading={setActive.isPending}
                onClick={() => setActive.mutate({ id: user.id, active: false }, { onSuccess: () => onOpenChange(false) })}
              >
                {t('deactivate.confirm')}
              </Button>
            </>
          }
        >
          <p className="text-sm text-fg-muted">
            {t('deactivate.account')} <span className="font-medium text-fg">{user.email}</span>
          </p>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
