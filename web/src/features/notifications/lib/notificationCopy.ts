import type { TFunction } from 'i18next'
import { STATUS_META, statusLabel } from '@/shared/lib'
import { NotificationType, type Notification } from '../api/notificationsApi'

/**
 * Translated title/body for a notification. The backend stores no text — only `type` + statuses + actor —
 * so the copy follows the UI language. Unknown types fall back to a generic line.
 */
export function notificationCopy(n: Notification, t: TFunction<'notifications'>) {
  if (n.type !== NotificationType.ServiceRequestStatusChanged || n.newStatus == null) {
    return { title: t('types.generic.title'), body: n.serviceRequestTitle ?? '' }
  }
  const nextKey = STATUS_META[n.newStatus]?.i18nKey
  const title = nextKey ? t(`types.statusChanged.title.${nextKey}`) : t('types.statusChanged.title.default')
  const vars = {
    title: n.serviceRequestTitle ?? t('types.statusChanged.untitled'),
    next: statusLabel(n.newStatus),
    prev: n.previousStatus != null ? statusLabel(n.previousStatus) : '',
    actor: n.actorName ?? '',
  }
  const variant = n.previousStatus != null ? 'moved' : 'now'
  const body = t(`types.statusChanged.body.${variant}${n.actorName ? 'By' : ''}`, vars)
  return { title, body }
}
