import { ArrowRightLeft, Eye, MoreHorizontal, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useRole } from '@/features/auth'
import type { ServiceRequest } from '@/shared/types'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui'
import { getRequestPermissions } from '../lib/permissions'

interface Props {
  request: ServiceRequest
  onAssign: (request: ServiceRequest) => void
  onChangeStatus: (request: ServiceRequest) => void
}

export function RequestRowActions({ request, onAssign, onChangeStatus }: Props) {
  const navigate = useNavigate()
  const role = useRole()
  const perms = getRequestPermissions(request, role)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Request actions" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={() => navigate(`/requests/${request.id}`)}>
          <Eye /> View
        </DropdownMenuItem>
        {perms.canAssign ? (
          <DropdownMenuItem onSelect={() => onAssign(request)}>
            <UserPlus /> Assign worker
          </DropdownMenuItem>
        ) : null}
        {perms.canChangeStatus ? (
          <DropdownMenuItem onSelect={() => onChangeStatus(request)}>
            <ArrowRightLeft /> Change status
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
