import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'

interface PaginationProps {
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
}

export function Pagination({ page, pageSize, totalCount, onPageChange, onPageSizeChange, pageSizeOptions = [10, 20, 50] }: PaginationProps) {
  const { t } = useTranslation()
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(totalCount, page * pageSize)
  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="tabular">{t('pagination.range', { from, to, total: totalCount })}</span>
        {onPageSizeChange ? (
          <label className="flex items-center gap-1.5 text-xs">
            {t('pagination.rows')}
            <select
              className="h-7 rounded border border-border bg-surface px-1.5 text-xs text-fg"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label={t('pagination.previous')}>
          <ChevronLeft />
        </Button>
        <span className="min-w-20 text-center text-xs tabular">{t('pagination.page', { page, total: totalPages })}</span>
        <Button variant="ghost" size="icon-sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label={t('pagination.next')}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
