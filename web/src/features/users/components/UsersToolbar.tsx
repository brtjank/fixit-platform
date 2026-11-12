import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input, NativeSelect } from '@/shared/ui'
import { UserRoleFilter, type RoleFilterValue } from './UserRoleFilter'

export type StatusFilterValue = 'active' | 'inactive' | 'all'

interface UsersToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  role: RoleFilterValue
  onRoleChange: (value: RoleFilterValue) => void
  status: StatusFilterValue
  onStatusChange: (value: StatusFilterValue) => void
}

export function UsersToolbar({ search, onSearchChange, role, onRoleChange, status, onStatusChange }: UsersToolbarProps) {
  const { t } = useTranslation('users')
  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center">
      <div className="relative w-full lg:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('toolbar.searchPlaceholder')}
          aria-label={t('toolbar.searchLabel')}
          className="pl-9"
        />
      </div>
      <UserRoleFilter value={role} onChange={onRoleChange} />
      <div className="lg:ml-auto lg:w-40">
        <NativeSelect value={status} onChange={(e) => onStatusChange(e.target.value as StatusFilterValue)} aria-label={t('toolbar.statusLabel')}>
          <option value="all">{t('toolbar.allStatuses')}</option>
          <option value="active">{t('status.active')}</option>
          <option value="inactive">{t('status.inactive')}</option>
        </NativeSelect>
      </div>
    </div>
  )
}
