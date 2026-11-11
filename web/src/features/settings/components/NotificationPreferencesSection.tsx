import { ErrorState, Card, Skeleton, Switch } from '@/shared/ui'
import type { NotificationPreferences } from '../api/settingsApi'
import { useNotificationPreferences, useUpdateNotificationPreferences } from '../hooks'
import { SectionHeading } from './SectionCard'

const ITEMS: { key: keyof NotificationPreferences; title: string; description: string }[] = [
  { key: 'emailOnNewRequest', title: 'New requests', description: 'Email me when a new service request is created.' },
  { key: 'emailOnAssignment', title: 'Assignments', description: 'Email me when a request is assigned to me or a worker.' },
  { key: 'emailOnStatusChange', title: 'Status changes', description: 'Email me when the status of a request changes.' },
  { key: 'dailyDigest', title: 'Daily digest', description: 'A morning summary of open and completed requests.' },
]

export function NotificationPreferencesSection() {
  const prefs = useNotificationPreferences()
  const update = useUpdateNotificationPreferences()

  return (
    <section>
      <SectionHeading title="Notifications" description="Choose which emails you receive." mock />
      {prefs.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : prefs.isError || !prefs.data ? (
        <ErrorState retry={() => void prefs.refetch()} />
      ) : (
        <Card className="divide-y divide-border">
          {ITEMS.map((item) => {
            const data = prefs.data
            return (
              <div key={item.key} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p id={`pref-${item.key}`} className="text-sm font-medium text-fg">
                    {item.title}
                  </p>
                  <p className="text-xs text-fg-muted">{item.description}</p>
                </div>
                <Switch
                  aria-labelledby={`pref-${item.key}`}
                  checked={data[item.key]}
                  disabled={update.isPending}
                  onCheckedChange={(checked) => update.mutate({ ...data, [item.key]: checked })}
                />
              </div>
            )
          })}
        </Card>
      )}
    </section>
  )
}
