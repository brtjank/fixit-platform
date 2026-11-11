import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const d = typeof value === 'string' ? parseISO(value) : value
  return isValid(d) ? d : null
}

export function formatDate(value: string | Date | null | undefined, pattern = 'd MMM yyyy') {
  const d = toDate(value)
  return d ? format(d, pattern) : '—'
}

export function formatDateTime(value: string | Date | null | undefined) {
  return formatDate(value, 'd MMM yyyy, HH:mm')
}

export function formatRelative(value: string | Date | null | undefined) {
  const d = toDate(value)
  return d ? `${formatDistanceToNowStrict(d)} ago` : '—'
}

export function fullName(user: { firstName: string; lastName: string } | null | undefined) {
  if (!user) return 'Unknown'
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
