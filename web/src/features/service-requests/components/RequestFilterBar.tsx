import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkers } from '@/features/users/hooks'
import { useDebounce } from '@/shared/hooks'
import { fullName } from '@/shared/lib'
import { SERVICE_REQUEST_SEARCH_MAX_LENGTH } from '@/shared/types'
import { Button, Input, NativeSelect } from '@/shared/ui'
import { StatusFilterTabs } from './StatusFilterTabs'
import type { useRequestFilters } from './useRequestFilters'

export function RequestFilterBar({ filters }: { filters: ReturnType<typeof useRequestFilters> }) {
  const { t } = useTranslation('requests')
  const workers = useWorkers()
  const [search, setSearch] = useState(filters.q)
  const debounced = useDebounce(search, 250)
  const { setFilter, q } = filters

  useEffect(() => {
    if (debounced.trim() !== q) setFilter('q', debounced.trim() || undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only push debounced input to the URL
  }, [debounced])

  // Keep the input in sync when the URL is cleared externally ("Clear filters").
  useEffect(() => {
    if (q === '') setSearch('')
  }, [q])

  return (
    <div className="space-y-3 border-b border-border p-4">
      <StatusFilterTabs value={filters.status} onChange={(s) => setFilter('status', s)} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('list.filters.searchPlaceholder')}
            aria-label={t('list.filters.searchLabel')}
            maxLength={SERVICE_REQUEST_SEARCH_MAX_LENGTH}
            className="pl-9"
          />
        </div>
        <div className="sm:w-56">
          <NativeSelect
            aria-label={t('list.filters.byWorker')}
            value={filters.assignedWorkerId}
            onChange={(e) => setFilter('assignedWorkerId', e.target.value || undefined)}
          >
            <option value="">{t('list.filters.anyWorker')}</option>
            {(workers.data?.items ?? []).map((w) => (
              <option key={w.id} value={w.id}>
                {fullName(w)}
                {w.isActive ? '' : t('list.filters.inactive')}
              </option>
            ))}
          </NativeSelect>
        </div>
        {filters.hasFilters ? (
          <Button variant="ghost" size="sm" className="sm:ml-auto" onClick={filters.clear}>
            <X /> {t('common:actions.clearFilters')}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
