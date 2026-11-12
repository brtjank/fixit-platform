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
  /** i18n key under common:nav.* */
  labelKey: string
  to: string
  icon: LucideIcon
  roles: UserRole[]
  /** Match nested routes too */
  end?: boolean
}

export interface NavSection {
  /** i18n key under common:nav.sections.* */
  titleKey?: string
  items: NavItem[]
}

const ALL = [UserRole.Admin, UserRole.Worker, UserRole.Customer]

/** Role-aware navigation. Every route listed here must exist in app/router.tsx. */
export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { labelKey: 'dashboard', to: '/', icon: LayoutDashboard, roles: [UserRole.Admin, UserRole.Worker], end: true },
      { labelKey: 'myRequests', to: '/', icon: ClipboardList, roles: [UserRole.Customer], end: true },
      { labelKey: 'newRequest', to: '/requests/new', icon: PlusCircle, roles: [UserRole.Customer] },
    ],
  },
  {
    titleKey: 'operations',
    items: [
      { labelKey: 'serviceRequests', to: '/requests', icon: ClipboardList, roles: [UserRole.Admin, UserRole.Worker] },
      { labelKey: 'myAssignments', to: '/my-assignments', icon: Briefcase, roles: [UserRole.Worker] },
      { labelKey: 'workers', to: '/workers', icon: HardHat, roles: [UserRole.Admin, UserRole.Worker] },
    ],
  },
  {
    titleKey: 'administration',
    items: [
      { labelKey: 'users', to: '/users', icon: Users, roles: [UserRole.Admin] },
      { labelKey: 'settings', to: '/settings', icon: Settings, roles: ALL },
      { labelKey: 'notifications', to: '/notifications', icon: Bell, roles: ALL },
    ],
  },
]

export function navForRole(role: UserRole): NavSection[] {
  return NAV_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => i.roles.includes(role)) })).filter((s) => s.items.length > 0)
}
