import { format, formatDistanceToNowStrict, isValid, parseISO, type Locale } from 'date-fns'
import { enGB, pl } from 'date-fns/locale'
import { i18n } from '@/i18n'

const LOCALES: Record<string, Locale> = { en: enGB, pl }

/** date-fns locale for the active UI language. */
export function getDateLocale(): Locale {
  return LOCALES[i18n.language?.slice(0, 2) ?? 'en'] ?? enGB
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const d = typeof value === 'string' ? parseISO(value) : value
  return isValid(d) ? d : null
}

export function formatDate(value: string | Date | null | undefined, pattern = 'd MMM yyyy') {
  const d = toDate(value)
  return d ? format(d, pattern, { locale: getDateLocale() }) : '—'
}

export function formatDateTime(value: string | Date | null | undefined) {
  return formatDate(value, 'd MMM yyyy, HH:mm')
}

export function formatRelative(value: string | Date | null | undefined) {
  const d = toDate(value)
  if (!d) return '—'
  return i18n.t('common:format.ago', { distance: formatDistanceToNowStrict(d, { locale: getDateLocale() }) })
}

export function fullName(user: { firstName: string; lastName: string } | null | undefined) {
  if (!user) return i18n.t('common:format.unknownUser')
  return `${user.firstName} ${user.lastName}`.trim()
}

export function initials(user: { firstName: string; lastName: string } | null | undefined) {
  if (!user) return '?'
  return `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
}

/** Short, human-friendly reference for a GUID, e.g. "SR-3F9A2C". */
export function shortId(id: string, prefix = '') {
  const tail = id.replace(/-/g, '').slice(-6).toUpperCase()
  return prefix ? `${prefix}-${tail}` : tail
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}
