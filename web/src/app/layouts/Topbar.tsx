import { Bell, LogOut, Menu, Monitor, Moon, Settings, Sun, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { useLogout, useProfile, useRole } from '@/features/auth'
import { useUnreadCount } from '@/features/notifications/hooks'
import { env } from '@/shared/config/env'
import { useTheme } from '@/shared/hooks'
import { cn, fullName, roleLabel } from '@/shared/lib'
import {
  Avatar,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  LanguageSwitcher,
  Tooltip,
} from '@/shared/ui'

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t } = useTranslation()
  const profile = useProfile()
  const role = useRole()
  const logout = useLogout()
  const navigate = useNavigate()
  const { theme, setTheme, resolved } = useTheme()
  const unread = useUnreadCount()

  const displayUser = profile ? { firstName: profile.firstName, lastName: profile.lastName } : null

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-6">
      <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onMenu} aria-label={t('nav.openMenu')}>
        <Menu />
      </Button>

      <div className="flex items-center gap-2">
        {env.apiMode === 'mock' ? (
          <Tooltip content={t('topbar.mockApiHint')}>
            <Badge tone="warning" dot className="cursor-default">
              {t('topbar.mockApi')}
            </Badge>
          </Tooltip>
        ) : (
          <Tooltip content={t('topbar.liveApiHint')}>
            <Badge tone="success" dot className="cursor-default">
              {t('topbar.liveApi')}
            </Badge>
          </Tooltip>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <LanguageSwitcher />
        <Tooltip content={t('topbar.theme', { theme: t(`theme.${theme}`) })}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('topbar.toggleTheme')}
            onClick={() => setTheme(theme === 'system' ? (resolved === 'dark' ? 'light' : 'dark') : theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'system' ? <Monitor /> : resolved === 'dark' ? <Moon /> : <Sun />}
          </Button>
        </Tooltip>

        <Tooltip content={t('nav.notifications')}>
          <Button variant="ghost" size="icon-sm" aria-label={t('nav.notifications')} asChild>
            <Link to="/notifications" className="relative">
              <Bell />
              {unread > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-fg-on-brand">
                  {unread > 9 ? '9+' : unread}
                </span>
              ) : null}
            </Link>
          </Button>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn('ml-1 flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-surface-hover')}
              aria-label={t('topbar.accountMenu')}
            >
              <Avatar user={displayUser} size="sm" />
              <span className="hidden text-left leading-tight sm:block">
                <span className="block max-w-36 truncate text-xs font-medium">{fullName(displayUser)}</span>
                <span className="block text-[11px] text-fg-subtle">{role ? roleLabel(role) : ''}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="truncate text-xs font-medium text-fg">{profile?.email}</div>
              <div className="truncate text-[11px] font-normal">{profile?.tenantName}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/settings')}>
              <User /> {t('topbar.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/settings')}>
              <Settings /> {t('topbar.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={logout}>
              <LogOut /> {t('topbar.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
