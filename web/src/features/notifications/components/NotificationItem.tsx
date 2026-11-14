import { Bell, ClipboardList } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn, formatRelative } from '@/shared/lib'
import { Button } from '@/shared/ui'
import type { Notification } from '../api/notificationsApi'
import { notificationCopy } from '../lib/notificationCopy'

export function NotificationItem({
  n,
  onOpen,
  onMarkRead,
  markingRead,
}: {
  n: Notification
  onOpen: (n: Notification) => void
  onMarkRead: (n: Notification) => void
  markingRead?: boolean
}) {
  const { t } = useTranslation('notifications')
  const unread = !n.readAt
  const Icon = n.serviceRequestId ? ClipboardList : Bell
  const { title, body } = notificationCopy(n, t)
  return (
    <div className={cn('group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-hover', unread && 'bg-brand-soft/30')}>
      <span className={cn('mt-2 size-2 shrink-0 rounded-full', unread ? 'bg-brand' : 'bg-transparent')} aria-label={unread ? t('list.unreadIndicator') : undefined} />
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-subtle text-fg-muted">
        <Icon className="size-4" />
      </span>
      <button type="button" onClick={() => onOpen(n)} className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <p className={cn('truncate text-sm text-fg', unread ? 'font-semibold' : 'font-medium')}>{title}</p>
        {body ? <p className="mt-0.5 line-clamp-2 text-sm text-fg-muted">{body}</p> : null}
        <p className="mt-1 text-xs text-fg-subtle">{formatRelative(n.createdAt)}</p>
      </button>
      {unread ? (
        <Button
          variant="ghost"
          size="sm"
          loading={markingRead}
          className="shrink-0 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
          onClick={() => onMarkRead(n)}
        >
          {t('list.markRead')}
        </Button>
      ) : null}
    </div>
  )
}
