import {
  Bell,
  ClipboardList,
  HardHat,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
  Briefcase,
  PlusCircle,
} from 'lucide-react'
import { UserRole } from '@/shared/types'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  roles: UserRole[]
  /** Match nested routes too */
  end?: boolean
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

const ALL = [UserRole.Admin, UserRole.Worker, UserRole.Customer]

/** Role-aware navigation. Every route listed here must exist in app/router.tsx. */
export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard, roles: [UserRole.Admin, UserRole.Worker], end: true },
      { label: 'My requests', to: '/', icon: ClipboardList, roles: [UserRole.Customer], end: true },
      { label: 'New request', to: '/requests/new', icon: PlusCircle, roles: [UserRole.Customer] },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Service requests', to: '/requests', icon: ClipboardList, roles: [UserRole.Admin, UserRole.Worker] },
      { label: 'My assignments', to: '/my-assignments', icon: Briefcase, roles: [UserRole.Worker] },
      { label: 'Workers', to: '/workers', icon: HardHat, roles: [UserRole.Admin, UserRole.Worker] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users', to: '/users', icon: Users, roles: [UserRole.Admin] },
      { label: 'Settings', to: '/settings', icon: Settings, roles: ALL },
      { label: 'Notifications', to: '/notifications', icon: Bell, roles: ALL },
    ],
  },
]

export function navForRole(role: UserRole): NavSection[] {
  return NAV_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => i.roles.includes(role)) })).filter((s) => s.items.length > 0)
}
