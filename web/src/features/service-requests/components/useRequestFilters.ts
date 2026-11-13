import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { parseStatus } from '@/shared/lib'
import {
  DEFAULT_SERVICE_REQUEST_SORT,
  SERVICE_REQUEST_SORT_FIELDS,
  type ServiceRequestSort,
  type ServiceRequestSortField,
  type SortDirection,
} from '@/shared/types'

type FilterKey = 'status' | 'assignedWorkerId' | 'q'

/** Parses `field:dir` from the URL; anything unknown falls back to the default (never sent to the API). */
export function parseSort(raw: string | null): { field: ServiceRequestSortField; direction: SortDirection } {
  const [field, dir = 'asc'] = (raw ?? DEFAULT_SERVICE_REQUEST_SORT).split(':')
  const knownField = SERVICE_REQUEST_SORT_FIELDS.find((f) => f.toLowerCase() === field?.toLowerCase())
  const direction = dir.toLowerCase()
  if (!knownField || (direction !== 'asc' && direction !== 'desc')) return parseSort(DEFAULT_SERVICE_REQUEST_SORT)
  return { field: knownField, direction }
}

/**
 * status / assignedWorkerId / q (server-side `?search=`) / sort live in the URL next to
 * usePagination's page/pageSize. Every change resets the page. The default sort is omitted from the URL.
 */
export function useRequestFilters() {
  const [params, setParams] = useSearchParams()
  const status = parseStatus(params.get('status'))
  const assignedWorkerId = params.get('assignedWorkerId') ?? ''
  const q = params.get('q') ?? ''
  const { field: sortField, direction: sortDirection } = parseSort(params.get('sort'))
  const sort: ServiceRequestSort = `${sortField}:${sortDirection}`

  const setFilter = useCallback(
    (key: FilterKey, value: string | number | undefined) =>
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          if (value === undefined || value === '') p.delete(key)
          else p.set(key, String(value))
          p.delete('page')
          return p
        },
        { replace: true },
      ),
    [setParams],
  )

  /** Clicking the active column flips the direction; a new column starts ascending (Created starts descending). */
  const toggleSort = useCallback(
    (field: ServiceRequestSortField) =>
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          const current = parseSort(p.get('sort'))
          const direction: SortDirection =
            current.field === field ? (current.direction === 'asc' ? 'desc' : 'asc') : field === 'createdAt' ? 'desc' : 'asc'
          const next: ServiceRequestSort = `${field}:${direction}`
          if (next === DEFAULT_SERVICE_REQUEST_SORT) p.delete('sort')
          else p.set('sort', next)
          p.delete('page')
          return p
        },
        { replace: true },
      ),
    [setParams],
  )

  // Sort is a view preference, not a filter: "Clear filters" keeps it.
  const clear = useCallback(
    () =>
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          for (const k of ['status', 'assignedWorkerId', 'q', 'page']) p.delete(k)
          return p
        },
        { replace: true },
      ),
    [setParams],
  )

  return {
    status,
    assignedWorkerId,
    q,
    sort,
    sortField,
    sortDirection,
    setFilter,
    toggleSort,
    clear,
    hasFilters: Boolean(status || assignedWorkerId || q),
  }
}
