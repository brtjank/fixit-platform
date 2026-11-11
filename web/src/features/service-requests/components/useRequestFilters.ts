import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { parseStatus } from '@/shared/lib'

type FilterKey = 'status' | 'assignedWorkerId' | 'q'

/** status / assignedWorkerId / q live in the URL next to usePagination's page/pageSize. */
export function useRequestFilters() {
  const [params, setParams] = useSearchParams()
  const status = parseStatus(params.get('status'))
  const assignedWorkerId = params.get('assignedWorkerId') ?? ''
  const q = params.get('q') ?? ''

  const setFilter = useCallback(
    (key: FilterKey, value: string | number | undefined) =>
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          if (value === undefined || value === '') p.delete(key)
          else p.set(key, String(value))
          // Search is client-side within the page, so it does not reset pagination.
          if (key !== 'q') p.delete('page')
          return p
        },
        { replace: true },
      ),
    [setParams],
  )

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

  return { status, assignedWorkerId, q, setFilter, clear, hasFilters: Boolean(status || assignedWorkerId || q) }
}
