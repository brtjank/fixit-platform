import { Eye, MoreHorizontal, Pencil, UserCheck, UserX } from 'lucide-react'
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
  const navigate = useNavigate()
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${user.email}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(user)}>
          <Pencil /> Edit
        </DropdownMenuItem>
        {user.role === UserRole.Worker ? (
          <DropdownMenuItem onSelect={() => navigate(`/workers/${user.id}`)}>
            <Eye /> View as worker
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        {user.isActive ? (
          isSelf ? (
            <Tooltip content="You cannot deactivate your own account" side="left">
              <span className="block">
                <DropdownMenuItem destructive disabled>
                  <UserX /> Deactivate
                </DropdownMenuItem>
              </span>
            </Tooltip>
          ) : (
            <DropdownMenuItem destructive onSelect={() => onDeactivate(user)}>
              <UserX /> Deactivate
            </DropdownMenuItem>
          )
        ) : (
          <DropdownMenuItem onSelect={() => onActivate(user)}>
            <UserCheck /> Activate
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
