import { Bell, LogOut, Menu, Monitor, Moon, Settings, Sun, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { useLogout, useProfile, useRole } from '@/features/auth'
import { useUnreadCount } from '@/features/notifications/hooks'
import { env } from '@/shared/config/env'
import { useTheme } from '@/shared/hooks'
import { cn, fullName, ROLE_META } from '@/shared/lib'
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
  Tooltip,
} from '@/shared/ui'

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const profile = useProfile()
  const role = useRole()
  const logout = useLogout()
  const navigate = useNavigate()
  const { theme, setTheme, resolved } = useTheme()
  const unread = useUnreadCount()

  const displayUser = profile ? { firstName: profile.firstName, lastName: profile.lastName } : null

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-6">
      <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu />
      </Button>

      <div className="flex items-center gap-2">
        {env.apiMode === 'mock' ? (
          <Tooltip content="All API calls are served by Mock Service Worker. Set VITE_API_MODE=live to use the backend.">
            <Badge tone="warning" dot className="cursor-default">
              Mock API
            </Badge>
          </Tooltip>
        ) : (
          <Tooltip content="Real backend endpoints are live; endpoints not implemented yet are still mocked.">
            <Badge tone="success" dot className="cursor-default">
              Live API
            </Badge>
          </Tooltip>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Tooltip content={`Theme: ${theme}`}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === 'system' ? (resolved === 'dark' ? 'light' : 'dark') : theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'system' ? <Monitor /> : resolved === 'dark' ? <Moon /> : <Sun />}
          </Button>
        </Tooltip>

        <Tooltip content="Notifications">
          <Button variant="ghost" size="icon-sm" aria-label="Notifications" asChild>
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
              aria-label="Account menu"
            >
              <Avatar user={displayUser} size="sm" />
              <span className="hidden text-left leading-tight sm:block">
                <span className="block max-w-36 truncate text-xs font-medium">{fullName(displayUser)}</span>
                <span className="block text-[11px] text-fg-subtle">{role ? ROLE_META[role].label : ''}</span>
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
              <User /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/settings')}>
              <Settings /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={logout}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
