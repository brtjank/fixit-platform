import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/** Page/pageSize synced with the URL (?page=2&pageSize=20). */
export function usePagination(defaultPageSize = 20) {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1)
  const pageSize = Math.max(1, Number(params.get('pageSize') ?? defaultPageSize) || defaultPageSize)

  const setPage = useCallback(
    (next: number) =>
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          if (next <= 1) p.delete('page')
          else p.set('page', String(next))
          return p
        },
        { replace: true },
      ),
    [setParams],
  )

  const setPageSize = useCallback(
    (next: number) =>
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          p.set('pageSize', String(next))
          p.delete('page')
          return p
        },
        { replace: true },
      ),
    [setParams],
  )

  return { page, pageSize, setPage, setPageSize }
}
