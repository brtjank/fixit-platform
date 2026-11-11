import { Building2, Code2, Bell, Palette, User, type LucideIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { cn } from '@/shared/lib'
import { PageHeader, Tabs, TabsList, TabsTrigger } from '@/shared/ui'
import { AppearanceSection } from '../components/AppearanceSection'
import { DeveloperSection } from '../components/DeveloperSection'
import { NotificationPreferencesSection } from '../components/NotificationPreferencesSection'
import { OrganizationSection } from '../components/OrganizationSection'
import { ProfileSection } from '../components/ProfileSection'

const SECTIONS: { id: string; label: string; icon: LucideIcon; Component: () => React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: User, Component: ProfileSection },
  { id: 'organization', label: 'Organization', icon: Building2, Component: OrganizationSection },
  { id: 'notifications', label: 'Notifications', icon: Bell, Component: NotificationPreferencesSection },
  { id: 'appearance', label: 'Appearance', icon: Palette, Component: AppearanceSection },
  { id: 'developer', label: 'Developer', icon: Code2, Component: DeveloperSection },
]

export default function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const active = SECTIONS.find((s) => s.id === requested) ?? SECTIONS[0]!
  const select = (id: string) => setParams({ tab: id }, { replace: true })

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, organization and preferences." />

      <Tabs value={active.id} onValueChange={select} className="mb-5 md:hidden">
        <div className="overflow-x-auto">
          <TabsList>
            {SECTIONS.map((s) => (
              <TabsTrigger key={s.id} value={s.id}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <div className="md:grid md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8">
        <nav aria-label="Settings sections" className="hidden md:block">
          <ul className="sticky top-20 space-y-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => select(s.id)}
                  aria-current={s.id === active.id ? 'page' : undefined}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    s.id === active.id ? 'bg-brand-soft text-brand-fg' : 'text-fg-muted hover:bg-surface-hover hover:text-fg',
                  )}
                >
                  <s.icon className="size-4" />
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="max-w-2xl min-w-0">
          <active.Component />
        </div>
      </div>
    </div>
  )
}
