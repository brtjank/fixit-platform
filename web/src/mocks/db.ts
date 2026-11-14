/**
 * In-memory mock database. Seeded once per page load; mutations persist for the session.
 * All mock handlers read/write through this module so features stay consistent
 * (e.g. changing a status via the mock API also appends a ServiceLog and notifies the request's participants).
 */
import { UserRole, type ServiceLog, type ServiceRequest, type ServiceRequestStatus, type User, type WorkerProfile } from '@/shared/types'
import { NotificationType, type Notification } from '@/features/notifications/api/notificationsApi'
import type { NotificationPreferences, TenantSettings } from '@/features/settings/api/settingsApi'
import * as seed from './data/seed'

/** Row of the backend `Notifications` table (one per recipient). Mapped to `Notification` (the DTO) by toNotificationDto. */
export interface MockNotification {
  id: string
  tenantId: string
  recipientUserId: string
  type: string
  serviceRequestId: string | null
  previousStatus: ServiceRequestStatus | null
  newStatus: ServiceRequestStatus | null
  actorUserId: string | null
  sourceEventId: string
  createdAt: string
  readAt: string | null
}

export interface MockDb {
  /** The demo tenant incl. the settings columns (GET/PUT /api/tenants/current; /api/users/me reads its name). */
  tenant: TenantSettings
  users: User[]
  workerProfiles: WorkerProfile[]
  serviceRequests: ServiceRequest[]
  serviceLogs: ServiceLog[]
  notifications: MockNotification[]
  /** userId → saved preferences. No entry = DEFAULT_NOTIFICATION_PREFERENCES (as the backend with no row). */
  notificationPreferences: Record<string, NotificationPreferences>
  /** userId → plain-text password (mock only; the real backend stores a PBKDF2 hash). Seeded with DEMO_PASSWORD. */
  passwords: Record<string, string>
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

/**
 * Recipients of a ServiceRequestStatusChanged event — same rule as the backend consumer:
 * the request's customer, its assigned worker and every active Admin of the tenant; distinct, minus the actor,
 * only active non-deleted users of the same tenant.
 */
export function notificationRecipients(users: User[], sr: ServiceRequest, actorUserId: string | null) {
  const ids = new Set<string>([sr.customerId, ...(sr.assignedWorkerId ? [sr.assignedWorkerId] : [])])
  for (const u of users) if (u.role === UserRole.Admin && u.tenantId === sr.tenantId) ids.add(u.id)
  if (actorUserId) ids.delete(actorUserId)
  return users.filter((u) => ids.has(u.id) && u.tenantId === sr.tenantId && u.isActive && !u.isDeleted).map((u) => u.id)
}

/** Demo notifications derived from the most recent seeded ServiceLogs; each user's newest 3 are unread, the rest read. */
function buildNotifications(): MockNotification[] {
  const requests = new Map(seed.serviceRequests.map((sr) => [sr.id, sr]))
  const out: MockNotification[] = []
  for (const log of seed.serviceLogs.slice(-25)) {
    const sr = requests.get(log.serviceRequestId)
    if (!sr) continue
    for (const recipientUserId of notificationRecipients(seed.users, sr, log.changedByUserId)) {
      out.push({
        id: seed.guid(`notif:${log.id}:${recipientUserId}`),
        tenantId: sr.tenantId,
        recipientUserId,
        type: NotificationType.ServiceRequestStatusChanged,
        serviceRequestId: sr.id,
        previousStatus: log.previousStatus,
        newStatus: log.newStatus,
        actorUserId: log.changedByUserId,
        sourceEventId: seed.guid(`event:${log.id}`),
        createdAt: log.createdAt,
        readAt: new Date(new Date(log.createdAt).getTime() + 3_600_000).toISOString(),
      })
    }
  }
  const unreadLeft = new Map<string, number>()
  for (const n of [...out].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    const left = unreadLeft.get(n.recipientUserId) ?? 3
    if (left > 0) n.readAt = null
    unreadLeft.set(n.recipientUserId, left - 1)
  }
  return out
}

export function createDb(): MockDb {
  return {
    // Same values as dev/seed.sql's UPDATE "Tenants".
    tenant: {
      ...clone(seed.tenant),
      contactEmail: 'biuro@hydro-serwis.pl',
      phone: '+48 22 123 45 67',
      address: 'ul. Wodna 12, 00-001 Warszawa',
      timezone: 'Europe/Warsaw',
      plan: 'team',
    },
    users: clone(seed.users),
    passwords: Object.fromEntries(seed.users.map((u) => [u.id, seed.DEMO_PASSWORD])),
    workerProfiles: clone(seed.workerProfiles),
    serviceRequests: clone(seed.serviceRequests),
    serviceLogs: clone(seed.serviceLogs),
    notifications: buildNotifications(),
    notificationPreferences: {},
  }
}

/**
 * Session persistence: the dataset survives page reloads within a tab (sessionStorage) so that
 * a request created or updated through the mock API does not vanish on refresh. Bump the version
 * when the seed changes shape. Closing the tab or calling resetDb() returns to the seed.
 */
const STORAGE_KEY = 'fixit.mockdb.v4'

function loadPersisted(): MockDb | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MockDb) : null
  } catch {
    return null
  }
}

export function persistDb() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    /* storage unavailable (private mode, quota) — mocks still work in memory */
  }
}

export const db: MockDb = loadPersisted() ?? createDb()

export function resetDb() {
  Object.assign(db, createDb())
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function newId() {
  return crypto.randomUUID()
}

export function nowIso() {
  return new Date().toISOString()
}

// ---- Query helpers shared by handlers ----------------------------------------

export function findUser(id: string) {
  return db.users.find((u) => u.id === id && !u.isDeleted) ?? null
}

export function findUserByEmail(email: string) {
  const needle = email.trim().toLowerCase()
  return db.users.find((u) => u.email.toLowerCase() === needle && !u.isDeleted) ?? null
}

/** Mock password check. Users missing from the map (e.g. an older persisted db) fall back to DEMO_PASSWORD. */
export function passwordMatches(userId: string, password: string | null | undefined) {
  return (db.passwords?.[userId] ?? seed.DEMO_PASSWORD) === password
}

export function setPassword(userId: string, password: string) {
  db.passwords ??= {}
  db.passwords[userId] = password
}

export function findServiceRequest(id: string) {
  return db.serviceRequests.find((sr) => sr.id === id && !sr.isDeleted) ?? null
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(1, page)
  const safeSize = Math.min(Math.max(1, pageSize), 100)
  return {
    items: items.slice((safePage - 1) * safeSize, safePage * safeSize),
    page: safePage,
    pageSize: safeSize,
    totalCount: items.length,
  }
}

/**
 * What the backend's outbox → queue → FixIt.Worker pipeline produces for one status change
 * (ChangeStatus or AssignWorker): one unread notification per recipient, actor excluded.
 */
export function notifyStatusChanged(sr: ServiceRequest, previousStatus: ServiceRequestStatus, newStatus: ServiceRequestStatus, actorUserId: string | null) {
  const sourceEventId = newId()
  const createdAt = nowIso()
  for (const recipientUserId of notificationRecipients(db.users, sr, actorUserId)) {
    db.notifications.push({
      id: newId(),
      tenantId: sr.tenantId,
      recipientUserId,
      type: NotificationType.ServiceRequestStatusChanged,
      serviceRequestId: sr.id,
      previousStatus,
      newStatus,
      actorUserId,
      sourceEventId,
      createdAt,
      readAt: null,
    })
  }
}

/** NotificationDto: request title and actor name joined in (actor null when unknown or deleted). */
export function toNotificationDto(n: MockNotification): Notification {
  const sr = n.serviceRequestId ? db.serviceRequests.find((x) => x.id === n.serviceRequestId) : null
  const actor = n.actorUserId ? findUser(n.actorUserId) : null
  return {
    id: n.id,
    type: n.type,
    serviceRequestId: n.serviceRequestId,
    serviceRequestTitle: sr?.title ?? null,
    previousStatus: n.previousStatus,
    newStatus: n.newStatus,
    actorName: actor ? `${actor.firstName} ${actor.lastName}` : null,
    createdAt: n.createdAt,
    readAt: n.readAt,
  }
}
