/**
 * In-memory mock database. Seeded once per page load; mutations persist for the session.
 * All mock handlers read/write through this module so features stay consistent
 * (e.g. changing a status via the mock API also appends a ServiceLog and a notification).
 */
import type { ServiceLog, ServiceRequest, User, WorkerProfile } from '@/shared/types'
import type { Notification } from '@/features/notifications/api/notificationsApi'
import type { NotificationPreferences, TenantSettings } from '@/features/settings/api/settingsApi'
import * as seed from './data/seed'

export interface MockDb {
  /** The demo tenant incl. the settings columns (GET/PUT /api/tenants/current; /api/users/me reads its name). */
  tenant: TenantSettings
  users: User[]
  workerProfiles: WorkerProfile[]
  serviceRequests: ServiceRequest[]
  serviceLogs: ServiceLog[]
  notifications: Notification[]
  /** userId → saved preferences. No entry = DEFAULT_NOTIFICATION_PREFERENCES (as the backend with no row). */
  notificationPreferences: Record<string, NotificationPreferences>
  /** userId → plain-text password (mock only; the real backend stores a PBKDF2 hash). Seeded with DEMO_PASSWORD. */
  passwords: Record<string, string>
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function buildNotifications(): Notification[] {
  const recent = seed.serviceRequests.slice(0, 6)
  return recent.map((sr, i) => ({
    id: seed.guid(`notif:${sr.id}`),
    title: i % 2 === 0 ? 'New service request' : 'Status updated',
    body: i % 2 === 0 ? `${sr.title} was submitted and is waiting for assignment.` : `${sr.title} changed status.`,
    serviceRequestId: sr.id,
    createdAt: sr.createdAt,
    readAt: i > 2 ? sr.createdAt : null,
  }))
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
const STORAGE_KEY = 'fixit.mockdb.v3'

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

export function pushNotification(n: Omit<Notification, 'id' | 'createdAt' | 'readAt'>) {
  db.notifications.unshift({ ...n, id: newId(), createdAt: nowIso(), readAt: null })
}
