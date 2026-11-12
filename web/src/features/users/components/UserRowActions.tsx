import { Eye, MoreHorizontal, Pencil, UserCheck, UserX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { UserRole, type User } from '@/shared/types'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
} from '@/shared/ui'

interface UserRowActionsProps {
  user: User
  isSelf: boolean
  onEdit: (user: User) => void
  onDeactivate: (user: User) => void
  onActivate: (user: User) => void
}

export function UserRowActions({ user, isSelf, onEdit, onDeactivate, onActivate }: UserRowActionsProps) {
  const { t } = useTranslation('users')
  const navigate = useNavigate()
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t('rowActions.menuLabel', { email: user.email })}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(user)}>
          <Pencil /> {t('rowActions.edit')}
        </DropdownMenuItem>
        {user.role === UserRole.Worker ? (
          <DropdownMenuItem onSelect={() => navigate(`/workers/${user.id}`)}>
            <Eye /> {t('rowActions.viewAsWorker')}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        {user.isActive ? (
          isSelf ? (
            <Tooltip content={t('rowActions.cannotDeactivateSelf')} side="left">
              <span className="block">
                <DropdownMenuItem destructive disabled>
                  <UserX /> {t('rowActions.deactivate')}
                </DropdownMenuItem>
              </span>
            </Tooltip>
          ) : (
            <DropdownMenuItem destructive onSelect={() => onDeactivate(user)}>
              <UserX /> {t('rowActions.deactivate')}
            </DropdownMenuItem>
          )
        ) : (
          <DropdownMenuItem onSelect={() => onActivate(user)}>
            <UserCheck /> {t('rowActions.activate')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
