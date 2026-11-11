import { Wrench, X } from 'lucide-react'
import { NavLink } from 'react-router'
import { useProfile, useRole } from '@/features/auth'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui'
import { navForRole } from '../navigation'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const role = useRole()
  const profile = useProfile()
  const sections = role ? navForRole(role) : []

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn('fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden', open ? 'opacity-100' : 'pointer-events-none opacity-0')}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-4">
          <NavLink to="/" className="flex items-center gap-2.5" onClick={onClose}>
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-fg-on-brand shadow-sm">
              <Wrench className="size-4" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight">FixIt</span>
              <span className="block max-w-36 truncate text-[11px] text-fg-subtle">{profile?.tenantName ?? 'Workspace'}</span>
            </span>
          </NavLink>
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onClose} aria-label="Close menu">
            <X />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section, i) => (
            <div key={section.title ?? i} className={cn(i > 0 && 'mt-6')}>
              {section.title ? (
                <div className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">{section.title}</div>
              ) : null}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to + item.label}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                          isActive ? 'bg-brand-soft text-brand-fg' : 'text-fg-muted hover:bg-surface-hover hover:text-fg',
                        )
                      }
                    >
                      <item.icon className="size-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3 text-[11px] text-fg-subtle">
          FixIt Platform · v0.1
        </div>
      </aside>
    </>
  )
}
