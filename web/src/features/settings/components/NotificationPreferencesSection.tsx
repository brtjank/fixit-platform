import { useTranslation } from 'react-i18next'
import { ErrorState, Card, Skeleton, Switch } from '@/shared/ui'
import type { NotificationPreferences } from '../api/settingsApi'
import { useNotificationPreferences, useUpdateNotificationPreferences } from '../hooks'
import { SectionHeading } from './SectionCard'

const ITEMS: (keyof NotificationPreferences)[] = ['emailOnNewRequest', 'emailOnAssignment', 'emailOnStatusChange', 'dailyDigest']

export function NotificationPreferencesSection() {
  const { t } = useTranslation('settings')
  const prefs = useNotificationPreferences()
  const update = useUpdateNotificationPreferences()

  return (
    <section>
      <SectionHeading title={t('preferences.title')} description={t('preferences.description')} />
      <p className="mb-3 rounded-md bg-bg-subtle px-3 py-2 text-xs text-fg-muted">{t('preferences.notSentYet')}</p>
      {prefs.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : prefs.isError || !prefs.data ? (
        <ErrorState retry={() => void prefs.refetch()} />
      ) : (
        <Card className="divide-y divide-border">
          {ITEMS.map((key) => {
            const data = prefs.data
            return (
              <div key={key} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p id={`pref-${key}`} className="text-sm font-medium text-fg">
                    {t(`preferences.${key}.title`)}
                  </p>
                  <p className="text-xs text-fg-muted">{t(`preferences.${key}.description`)}</p>
                </div>
                <Switch
                  aria-labelledby={`pref-${key}`}
                  checked={data[key]}
                  disabled={update.isPending}
                  onCheckedChange={(checked) => update.mutate({ ...data, [key]: checked })}
                />
              </div>
            )
          })}
        </Card>
      )}
    </section>
  )
}
