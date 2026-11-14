/**
 * Handlers for endpoints that EXIST on the backend. Registered only in mock mode
 * (in live mode these requests go to the real API through the Vite proxy).
 * Behaviour mirrors the controllers + use-case handlers (policies, validation, domain rules).
 */
import { delay, http, HttpResponse } from 'msw'
import { parseRole, parseStatus } from '@/shared/lib'
import {
  SERVICE_REQUEST_SEARCH_MAX_LENGTH,
  SERVICE_REQUEST_SORT_FIELDS,
  ServiceRequestStatus,
  UserRole,
  type ServiceRequestSortField,
  type SortDirection,
  type WorkerProfile,
  type AssignWorkerRequest,
  type ChangeServiceStatusRequest,
  type CreateServiceRequestRequest,
  type LoginRequest,
  type LoginResponse,
  type ServiceRequest,
  type User,
} from '@/shared/types'
import {
  WORKER_PHONE_MAX_LENGTH,
  WORKER_SPECIALIZATION_MAX_LENGTH,
  type UpdateWorkerProfileRequest,
  type WorkerWorkload,
} from '@/features/workers/api/workersApi'
import type { ActivityItem, DailyVolumePoint, DashboardStats, StatusBreakdown } from '@/features/dashboard/api/dashboardApi'
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  TENANT_ADDRESS_MAX_LENGTH,
  TENANT_CONTACT_EMAIL_MAX_LENGTH,
  TENANT_DESCRIPTION_MAX_LENGTH,
  TENANT_NAME_MAX_LENGTH,
  TENANT_PHONE_MAX_LENGTH,
  TenantErrorCodes,
  type NotificationPreferences,
  type UpdateTenantRequest,
} from '@/features/settings/api/settingsApi'
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  UserErrorCodes,
  type ChangeOwnPasswordRequest,
  type InviteUserRequest,
  type ResetUserPasswordRequest,
  type UpdateUserRequest,
} from '@/features/users/api/usersApi'
import { authorize, errors, isResponse, issueMockToken, Policies, resolveUser, type Principal } from '../auth'
import { db, findServiceRequest, findUser, findUserByEmail, newId, nowIso, paginate, passwordMatches, pushNotification, setPassword } from '../db'

const LATENCY = () => delay(250 + Math.random() * 250)

/** Tenant check + Customer scoping (customers can only read their own requests; others get 404). */
function canReadRequest(sr: ServiceRequest | null | undefined, auth: Principal): sr is ServiceRequest {
  if (!sr || sr.tenantId !== auth.tenantId) return false
  return auth.role !== UserRole.Customer || sr.customerId === auth.userId
}

const STATUS_NAMES = ['', 'Pending', 'Assigned', 'InProgress', 'Completed', 'Cancelled']

/** `field[:dir]`, case-insensitive; blank → createdAt:desc; invalid → null (400 SR_007_SORT_INVALID). */
function parseSortParam(raw: string | null): { field: ServiceRequestSortField; direction: SortDirection } | null {
  if (!raw?.trim()) return { field: 'createdAt', direction: 'desc' }
  const parts = raw.trim().split(':')
  if (parts.length > 2) return null
  const field = SERVICE_REQUEST_SORT_FIELDS.find((f) => f.toLowerCase() === parts[0].trim().toLowerCase())
  const direction = (parts[1]?.trim() || 'asc').toLowerCase()
  if (!field || (direction !== 'asc' && direction !== 'desc')) return null
  return { field, direction }
}

function compareBy(field: ServiceRequestSortField, a: ServiceRequest, b: ServiceRequest) {
  switch (field) {
    case 'title':
      return a.title.localeCompare(b.title)
    // The DB stores the enum as a string, so the backend orders by status NAME, not by workflow order.
    case 'status':
      return STATUS_NAMES[a.status].localeCompare(STATUS_NAMES[b.status])
    case 'createdAt':
      return a.createdAt.localeCompare(b.createdAt)
  }
}

/** Live user in the caller's tenant, or null (→ 404, never reveals other tenants). */
function findTenantUser(id: string, auth: Principal) {
  const user = findUser(id)
  return user && user.tenantId === auth.tenantId ? user : null
}

/** Password policy: 8–128 characters, otherwise 400 USR_007_PASSWORD_TOO_WEAK. */
function checkPassword(password: string | null | undefined) {
  if (typeof password === 'string' && password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH) return null
  return errors.badRequest(UserErrorCodes.PasswordTooWeak, `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`)
}

/** Trim; empty → null. */
function normalize(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

// ---- Dashboard / workload helpers ------------------------------------------------

const DAY_MS = 86_400_000
const OPEN_STATUSES: ServiceRequestStatus[] = [ServiceRequestStatus.Pending, ServiceRequestStatus.Assigned, ServiceRequestStatus.InProgress]

/** `(now - 30d, now]` / `(now - 60d, now - 30d]` membership for an ISO timestamp. */
function windows(now = Date.now()) {
  const inRange = (from: number, to: number) => (iso: string | null | undefined) => {
    if (!iso) return false
    const t = new Date(iso).getTime()
    return t > from && t <= to
  }
  return { last30: inRange(now - 30 * DAY_MS, now), prev30: inRange(now - 60 * DAY_MS, now - 30 * DAY_MS) }
}

/** completedAt per request id = createdAt of the LATEST ServiceLog with newStatus Completed. */
function completedAtMap(tenantId: string) {
  const map = new Map<string, string>()
  for (const l of db.serviceLogs) {
    if (l.tenantId !== tenantId || l.isDeleted || l.newStatus !== ServiceRequestStatus.Completed) continue
    const current = map.get(l.serviceRequestId)
    if (!current || l.createdAt > current) map.set(l.serviceRequestId, l.createdAt)
  }
  return map
}

const tenantRequests = (tenantId: string) => db.serviceRequests.filter((sr) => sr.tenantId === tenantId && !sr.isDeleted)

/** `pct(cur, prev) = prev == 0 ? (cur == 0 ? 0 : 100) : round((cur - prev) / prev * 100, 1)` */
const pct = (cur: number, prev: number) => (prev === 0 ? (cur === 0 ? 0 : 100) : Math.round(((cur - prev) / prev) * 1000) / 10)

/** Integer query param clamped to [min, max]; missing / non-numeric → fallback. */
function clampParam(raw: string | null, fallback: number, min: number, max: number) {
  const n = raw === null || raw.trim() === '' ? NaN : Number(raw)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : fallback
}

const displayName = (id: string | null | undefined) => {
  const u = id ? findUser(id) : null
  return u ? `${u.firstName} ${u.lastName}` : 'System'
}

/** TEN_004 rule: exactly one `@`, text on both sides, a dot in the domain. */
function isContactEmail(value: string) {
  const parts = value.split('@')
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0 && parts[1].includes('.')
}

/** Stand-in for TimeZoneInfo.TryFindSystemTimeZoneById: Intl rejects unknown IANA ids with a RangeError. */
function isKnownTimezone(id: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: id })
    return true
  } catch {
    return false
  }
}

export const backendHandlers = [
  // POST /api/auth/login — unknown / inactive / deleted user or wrong password → the same 401 AUTH_001
  http.post('/api/auth/login', async ({ request }) => {
    await LATENCY()
    const body = (await request.json()) as Partial<LoginRequest>
    const user = body.email ? findUserByEmail(body.email) : null
    if (!user || !user.isActive || !passwordMatches(user.id, body.password)) return errors.unauthorized()
    const res: LoginResponse = {
      token: issueMockToken(user),
      userId: user.id,
      tenantId: user.tenantId,
      role: (['Admin', 'Admin', 'Worker', 'Customer'] as const)[user.role],
    }
    return HttpResponse.json(res)
  }),

  // GET /api/service-requests
  http.get('/api/service-requests', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20)
    const statusRaw = url.searchParams.get('status')
    const status = parseStatus(statusRaw)
    if (statusRaw && !status) return errors.badRequest('ERR_001_UNEXPECTED', `Requested value '${statusRaw}' was not found.`)
    const assignedWorkerId = url.searchParams.get('assignedWorkerId')
    const customerId = url.searchParams.get('customerId')
    const search = (url.searchParams.get('search') ?? '').trim()
    if (search.length > SERVICE_REQUEST_SEARCH_MAX_LENGTH)
      return errors.badRequest('SR_006_SEARCH_TOO_LONG', `Search term cannot be longer than ${SERVICE_REQUEST_SEARCH_MAX_LENGTH} characters.`)
    const sortRaw = url.searchParams.get('sort')
    const sort = parseSortParam(sortRaw)
    if (!sort)
      return errors.badRequest('SR_007_SORT_INVALID', `Sort '${sortRaw}' is invalid. Allowed fields: createdAt, title, status; directions: asc, desc.`)

    let items = db.serviceRequests.filter((sr) => sr.tenantId === auth.tenantId && !sr.isDeleted)
    // Customers only ever see their own requests (backend forces this regardless of ?customerId).
    if (auth.role === UserRole.Customer) items = items.filter((sr) => sr.customerId === auth.userId)
    if (status) items = items.filter((sr) => sr.status === status)
    if (assignedWorkerId) items = items.filter((sr) => sr.assignedWorkerId === assignedWorkerId)
    if (customerId) items = items.filter((sr) => sr.customerId === customerId)
    if (search) {
      const term = search.toLowerCase()
      items = items.filter((sr) => sr.title.toLowerCase().includes(term) || sr.description.toLowerCase().includes(term))
    }
    // Ordering is always applied (deterministic paging); tie-break on id ascending.
    const sign = sort.direction === 'asc' ? 1 : -1
    items = [...items].sort((a, b) => sign * compareBy(sort.field, a, b) || a.id.localeCompare(b.id))
    return HttpResponse.json(paginate(items, page, pageSize))
  }),

  // GET /api/service-requests/{id}
  http.get('/api/service-requests/:id', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    const sr = findServiceRequest(String(params.id))
    if (!canReadRequest(sr, auth)) return errors.notFound('ServiceRequest', String(params.id))
    return HttpResponse.json(sr)
  }),

  // GET /api/service-requests/{id}/logs — ordered by createdAt ascending, plain array
  http.get('/api/service-requests/:id/logs', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    const id = String(params.id)
    if (!canReadRequest(findServiceRequest(id), auth)) return errors.notFound('ServiceRequest', id)
    const logs = db.serviceLogs.filter((l) => l.serviceRequestId === id && !l.isDeleted).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    return HttpResponse.json(logs)
  }),

  // POST /api/service-requests (CustomerOrAdmin)
  http.post('/api/service-requests', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.CustomerOrAdmin])
    if (isResponse(auth)) return auth
    const body = (await request.json()) as Partial<CreateServiceRequestRequest>
    if (!body.title?.trim()) return errors.badRequest('VAL_001_VALIDATION', 'Title is required.')
    if (body.title.length > 200) return errors.badRequest('VAL_001_VALIDATION', 'Title must not exceed 200 characters.')
    if (!body.description?.trim()) return errors.badRequest('VAL_001_VALIDATION', 'Description is required.')
    if (body.description.length > 2000) return errors.badRequest('VAL_001_VALIDATION', 'Description must not exceed 2000 characters.')
    if (!body.customerId) return errors.badRequest('VAL_001_VALIDATION', 'CustomerId is required.')
    const customer = findUser(body.customerId)
    if (!customer || customer.tenantId !== auth.tenantId) return errors.notFound('User', body.customerId)

    const sr: ServiceRequest = {
      id: newId(),
      tenantId: auth.tenantId,
      title: body.title.trim(),
      description: body.description.trim(),
      customerId: body.customerId,
      assignedWorkerId: null,
      status: ServiceRequestStatus.Pending,
      notes: null,
      createdAt: nowIso(),
      isDeleted: false,
    }
    db.serviceRequests.unshift(sr)
    pushNotification({ title: 'New service request', body: `${sr.title} was submitted and is waiting for assignment.`, serviceRequestId: sr.id })
    return HttpResponse.json(
      { id: sr.id, title: sr.title, description: sr.description, customerId: sr.customerId, status: sr.status, createdAt: sr.createdAt },
      { status: 201, headers: { Location: `/api/service-requests/${sr.id}` } },
    )
  }),

  // PUT /api/service-requests/{id}/assign-worker (WorkerOrAdmin)
  http.put('/api/service-requests/:id/assign-worker', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const id = String(params.id)
    const body = (await request.json()) as Partial<AssignWorkerRequest>
    const sr = findServiceRequest(id)
    if (!sr || sr.tenantId !== auth.tenantId) return errors.notFound('ServiceRequest', id)
    if (!body.workerId) return errors.badRequest('VAL_001_VALIDATION', 'WorkerId is required.')
    const worker = findUser(body.workerId)
    if (!worker || worker.tenantId !== auth.tenantId) return errors.notFound('User', body.workerId)
    if (worker.role !== UserRole.Worker)
      return errors.badRequest('USR_004_ROLE_INVALID', `User with id ${worker.id} has role ${['', 'Admin', 'Worker', 'Customer'][worker.role]}, but Worker is required.`)
    if (sr.status !== ServiceRequestStatus.Pending)
      return errors.badRequest(
        'SR_002_STATUS_INVALID_FOR_ASSIGNMENT',
        `Cannot assign worker to service request ${id} with status ${['', 'Pending', 'Assigned', 'InProgress', 'Completed', 'Cancelled'][sr.status]}. Only Pending requests can have workers assigned.`,
      )

    const previous = sr.status
    sr.assignedWorkerId = worker.id
    sr.status = ServiceRequestStatus.Assigned
    // Backend writes a Pending→Assigned ServiceLog on assignment (notes null).
    db.serviceLogs.push({ id: newId(), tenantId: sr.tenantId, serviceRequestId: sr.id, previousStatus: previous, newStatus: sr.status, notes: null, changedByUserId: auth.userId, createdAt: nowIso(), isDeleted: false })
    pushNotification({ title: 'Worker assigned', body: `${worker.firstName} ${worker.lastName} was assigned to “${sr.title}”.`, serviceRequestId: sr.id })
    return HttpResponse.json({ serviceRequestId: sr.id, assignedWorkerId: sr.assignedWorkerId, status: sr.status })
  }),

  // PUT /api/service-requests/{id}/change-status (WorkerOrAdmin)
  http.put('/api/service-requests/:id/change-status', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const id = String(params.id)
    const body = (await request.json()) as Partial<ChangeServiceStatusRequest>
    const sr = findServiceRequest(id)
    if (!sr || sr.tenantId !== auth.tenantId) return errors.notFound('ServiceRequest', id)
    const newStatus = parseStatus(body.newStatus as number)
    if (!newStatus) return errors.badRequest('VAL_001_VALIDATION', 'NewStatus must be a valid ServiceRequestStatus value.')
    if (body.notes && body.notes.length > 2000) return errors.badRequest('VAL_001_VALIDATION', 'Notes must not exceed 2000 characters.')
    const names = ['', 'Pending', 'Assigned', 'InProgress', 'Completed', 'Cancelled']
    if (sr.status === ServiceRequestStatus.Completed || sr.status === ServiceRequestStatus.Cancelled)
      return errors.badRequest('SR_001_STATUS_IMMUTABLE', `Cannot change status of service request ${id}. Status ${names[sr.status]} is immutable (Completed or Cancelled).`)
    if (newStatus === ServiceRequestStatus.InProgress && !sr.assignedWorkerId)
      return errors.badRequest('SR_003_WORKER_REQUIRED', `Cannot set service request ${id} status to InProgress without assigned worker.`)

    const previous = sr.status
    sr.status = newStatus
    if (body.notes?.trim()) sr.notes = body.notes.trim()
    db.serviceLogs.push({ id: newId(), tenantId: sr.tenantId, serviceRequestId: sr.id, previousStatus: previous, newStatus, notes: body.notes?.trim() || null, changedByUserId: auth.userId, createdAt: nowIso(), isDeleted: false })
    pushNotification({ title: 'Status updated', body: `“${sr.title}” is now ${names[newStatus]}.`, serviceRequestId: sr.id })
    return HttpResponse.json({ serviceRequestId: sr.id, status: sr.status })
  }),

  // GET /api/users (AdminOnly)
  http.get('/api/users', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.AdminOnly])
    if (isResponse(auth)) return auth
    const url = new URL(request.url)
    const items = db.users.filter((u) => u.tenantId === auth.tenantId && !u.isDeleted)
    return HttpResponse.json(paginate(items, Number(url.searchParams.get('page') ?? 1), Number(url.searchParams.get('pageSize') ?? 20)))
  }),

  // GET /api/users/me (any role) — User + tenantName. Registered before /api/users/:id (first match wins).
  http.get('/api/users/me', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    // Mock-mode tokens are only issued for users in the dataset, so the user is always found.
    const user = resolveUser(auth)
    if (!user) return errors.notFound('User', auth.userId)
    return HttpResponse.json({ ...user, tenantName: db.tenant.name })
  }),

  // GET / PUT /api/users/me/notification-preferences (any role, the caller's own) — before any /api/users/:id route
  http.get('/api/users/me/notification-preferences', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    return HttpResponse.json(db.notificationPreferences[auth.userId] ?? DEFAULT_NOTIFICATION_PREFERENCES)
  }),
  http.put('/api/users/me/notification-preferences', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    const body = (await request.json()) as Partial<NotificationPreferences>
    const keys = Object.keys(DEFAULT_NOTIFICATION_PREFERENCES) as (keyof NotificationPreferences)[]
    // Full replacement: all four bools are required.
    const missing = keys.filter((k) => typeof body?.[k] !== 'boolean')
    if (missing.length) return errors.badRequest('VAL_001_VALIDATION', `${missing.join(', ')} must be provided as boolean.`)
    const saved = Object.fromEntries(keys.map((k) => [k, body[k]])) as unknown as NotificationPreferences
    db.notificationPreferences[auth.userId] = saved
    return HttpResponse.json(saved)
  }),

  // GET /api/users/workers (WorkerOrAdmin)
  http.get('/api/users/workers', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const url = new URL(request.url)
    const items = db.users.filter((u) => u.tenantId === auth.tenantId && !u.isDeleted && u.role === UserRole.Worker)
    return HttpResponse.json(paginate(items, Number(url.searchParams.get('page') ?? 1), Number(url.searchParams.get('pageSize') ?? 10)))
  }),

  // GET /api/users/{id:guid} (any role) — tenant-scoped; other tenant / missing → 404. After /me and /workers.
  http.get('/api/users/:id', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    const id = String(params.id)
    const user = findUser(id)
    if (!user || user.tenantId !== auth.tenantId || user.isDeleted) return errors.notFound('User', id)
    return HttpResponse.json(user)
  }),

  // POST /api/users (AdminOnly) — 201 + Location; Worker → empty WorkerProfile
  http.post('/api/users', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.AdminOnly])
    if (isResponse(auth)) return auth
    const body = (await request.json()) as Partial<InviteUserRequest>
    const email = body.email?.trim() ?? ''
    const firstName = body.firstName?.trim() ?? ''
    const lastName = body.lastName?.trim() ?? ''
    const role = parseRole(body.role)
    if (!email) return errors.badRequest('USR_001_EMAIL_REQUIRED', 'User email is required and cannot be empty.')
    if (!firstName) return errors.badRequest('USR_002_NAME_REQUIRED', 'User FirstName is required and cannot be empty.')
    if (!lastName) return errors.badRequest('USR_002_NAME_REQUIRED', 'User LastName is required and cannot be empty.')
    if (!role) return errors.badRequest('USR_004_ROLE_INVALID', 'User role is invalid.')
    const weak = checkPassword(body.password)
    if (weak) return weak
    // Unique globally (login is by email across tenants), case-insensitive.
    if (findUserByEmail(email)) return errors.badRequest(UserErrorCodes.EmailTaken, `A user with email '${email}' already exists.`)
    const user: User = { id: newId(), tenantId: auth.tenantId, email, firstName, lastName, role, isActive: true, createdAt: nowIso(), isDeleted: false }
    db.users.push(user)
    setPassword(user.id, body.password!)
    if (role === UserRole.Worker) {
      db.workerProfiles.push({ id: newId(), tenantId: auth.tenantId, userId: user.id, specialization: null, phoneNumber: null, isAvailable: true, createdAt: nowIso(), isDeleted: false })
    }
    return HttpResponse.json(user, { status: 201, headers: { Location: `/api/users/${user.id}` } })
  }),

  // PUT /api/users/{id:guid} (AdminOnly) — full replacement of firstName/lastName/role
  http.put('/api/users/:id', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.AdminOnly])
    if (isResponse(auth)) return auth
    const id = String(params.id)
    const user = findTenantUser(id, auth)
    if (!user) return errors.notFound('User', id)
    const body = (await request.json()) as Partial<UpdateUserRequest>
    const firstName = body.firstName?.trim() ?? ''
    const lastName = body.lastName?.trim() ?? ''
    const role = parseRole(body.role)
    if (!firstName) return errors.badRequest('USR_002_NAME_REQUIRED', 'User FirstName is required and cannot be empty.')
    if (!lastName) return errors.badRequest('USR_002_NAME_REQUIRED', 'User LastName is required and cannot be empty.')
    if (!role) return errors.badRequest('USR_004_ROLE_INVALID', 'User role is invalid.')
    if (user.id === auth.userId && role !== user.role)
      return errors.badRequest(UserErrorCodes.SelfRoleChange, 'You cannot change your own role.')
    user.firstName = firstName
    user.lastName = lastName
    user.role = role
    return HttpResponse.json(user)
  }),

  // PUT /api/users/{id:guid}/deactivate (AdminOnly) — idempotent; self → 400 USR_006
  http.put('/api/users/:id/deactivate', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.AdminOnly])
    if (isResponse(auth)) return auth
    const id = String(params.id)
    const user = findTenantUser(id, auth)
    if (!user) return errors.notFound('User', id)
    if (user.id === auth.userId) return errors.badRequest(UserErrorCodes.SelfDeactivate, 'You cannot deactivate your own account.')
    user.isActive = false
    return HttpResponse.json(user)
  }),

  // PUT /api/users/{id:guid}/activate (AdminOnly) — idempotent; soft-deleted → 400 USR_003
  http.put('/api/users/:id/activate', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.AdminOnly])
    if (isResponse(auth)) return auth
    const id = String(params.id)
    const user = db.users.find((u) => u.id === id && u.tenantId === auth.tenantId)
    if (!user) return errors.notFound('User', id)
    if (user.isDeleted) return errors.badRequest('USR_003_CANNOT_ACTIVATE', `Cannot activate user ${id}. User is deleted.`)
    user.isActive = true
    return HttpResponse.json(user)
  }),

  // PUT /api/users/me/password (any role) — 200 { token } (fresh JWT). Registered before /api/users/:id/password (first match wins).
  http.put('/api/users/me/password', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    const user = resolveUser(auth)
    if (!user) return errors.notFound('User', auth.userId)
    const body = (await request.json()) as Partial<ChangeOwnPasswordRequest>
    if (!passwordMatches(user.id, body.currentPassword))
      return errors.badRequest(UserErrorCodes.PasswordMismatch, 'Current password is incorrect.')
    const weak = checkPassword(body.newPassword)
    if (weak) return weak
    setPassword(user.id, body.newPassword!)
    return HttpResponse.json({ token: issueMockToken(user) })
  }),

  // PUT /api/users/{id:guid}/password (AdminOnly) — admin reset, 204
  http.put('/api/users/:id/password', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.AdminOnly])
    if (isResponse(auth)) return auth
    const id = String(params.id)
    const user = findTenantUser(id, auth)
    if (!user) return errors.notFound('User', id)
    const body = (await request.json()) as Partial<ResetUserPasswordRequest>
    const weak = checkPassword(body.newPassword)
    if (weak) return weak
    setPassword(user.id, body.newPassword!)
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /api/workers/profiles (WorkerOrAdmin) — plain array, ordered by createdAt asc then id
  http.get('/api/workers/profiles', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const profiles = db.workerProfiles
      .filter((p) => p.tenantId === auth.tenantId && !p.isDeleted)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
    return HttpResponse.json(profiles)
  }),

  // GET /api/workers/{userId:guid}/profile (any role) — 404 when no profile in the caller's tenant
  http.get('/api/workers/:userId/profile', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    const userId = String(params.userId)
    const profile = db.workerProfiles.find((p) => p.userId === userId && p.tenantId === auth.tenantId && !p.isDeleted)
    if (!profile) return errors.notFound('WorkerProfile', userId)
    return HttpResponse.json(profile)
  }),

  // PUT /api/workers/{userId:guid}/profile (WorkerOrAdmin; Worker: self only → else 404) — full replacement, upsert, 200
  http.put('/api/workers/:userId/profile', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const userId = String(params.userId)
    if (auth.role === UserRole.Worker && auth.userId !== userId) return errors.notFound('Worker', userId)
    const body = (await request.json()) as Partial<UpdateWorkerProfileRequest>
    const specialization = normalize(body.specialization)
    const phoneNumber = normalize(body.phoneNumber)
    if (specialization && specialization.length > WORKER_SPECIALIZATION_MAX_LENGTH)
      return errors.badRequest('WRK_001_SPECIALIZATION_TOO_LONG', `Worker specialization cannot be longer than ${WORKER_SPECIALIZATION_MAX_LENGTH} characters.`)
    if (phoneNumber && phoneNumber.length > WORKER_PHONE_MAX_LENGTH)
      return errors.badRequest('WRK_002_PHONE_TOO_LONG', `Worker phone number cannot be longer than ${WORKER_PHONE_MAX_LENGTH} characters.`)
    const worker = findUser(userId)
    if (!worker || worker.tenantId !== auth.tenantId || worker.isDeleted || worker.role !== UserRole.Worker)
      return errors.notFound('Worker', userId)

    let profile = db.workerProfiles.find((p) => p.userId === userId && p.tenantId === auth.tenantId && !p.isDeleted)
    if (!profile) {
      const created: WorkerProfile = { id: newId(), tenantId: auth.tenantId, userId, specialization, phoneNumber, isAvailable: true, createdAt: nowIso(), isDeleted: false }
      db.workerProfiles.push(created)
      profile = created
    }
    profile.specialization = specialization
    profile.phoneNumber = phoneNumber
    profile.isAvailable = body.isAvailable ?? profile.isAvailable
    return HttpResponse.json(profile)
  }),

  // GET /api/workers/workload (WorkerOrAdmin) — one row per Worker (inactive included), ordered by createdAt then id
  http.get('/api/workers/workload', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const { last30 } = windows()
    const completedAt = completedAtMap(auth.tenantId)
    const requests = tenantRequests(auth.tenantId)
    const result: WorkerWorkload[] = db.users
      .filter((u) => u.tenantId === auth.tenantId && u.role === UserRole.Worker && !u.isDeleted)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
      .map((w) => {
        const mine = requests.filter((sr) => sr.assignedWorkerId === w.id)
        return {
          workerId: w.id,
          open: mine.filter((sr) => sr.status === ServiceRequestStatus.Assigned || sr.status === ServiceRequestStatus.InProgress).length,
          inProgress: mine.filter((sr) => sr.status === ServiceRequestStatus.InProgress).length,
          completedLast30Days: mine.filter((sr) => sr.status === ServiceRequestStatus.Completed && last30(completedAt.get(sr.id))).length,
        }
      })
    return HttpResponse.json(result)
  }),

  // GET /api/dashboard/stats (WorkerOrAdmin)
  http.get('/api/dashboard/stats', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const { last30, prev30 } = windows()
    const all = tenantRequests(auth.tenantId)
    const completedAt = completedAtMap(auth.tenantId)
    const completedIn = (inWindow: (iso: string | undefined) => boolean) => all.filter((sr) => inWindow(completedAt.get(sr.id)))
    const avgHours = (list: ServiceRequest[]) =>
      list.length === 0
        ? 0
        : list.reduce((sum, sr) => sum + (new Date(completedAt.get(sr.id)!).getTime() - new Date(sr.createdAt).getTime()) / 3_600_000, 0) / list.length
    const completedLast = completedIn(last30)
    const completedPrev = completedIn(prev30)
    const avgLast = avgHours(completedLast)
    const avgPrev = avgHours(completedPrev)
    const workers = db.users.filter((u) => u.tenantId === auth.tenantId && u.role === UserRole.Worker && u.isActive && !u.isDeleted)
    // A worker without a profile counts as available.
    const available = workers.filter((w) => db.workerProfiles.find((p) => p.userId === w.id && !p.isDeleted)?.isAvailable !== false)
    const stats: DashboardStats = {
      openRequests: all.filter((sr) => OPEN_STATUSES.includes(sr.status)).length,
      pendingUnassigned: all.filter((sr) => sr.status === ServiceRequestStatus.Pending).length,
      inProgress: all.filter((sr) => sr.status === ServiceRequestStatus.InProgress).length,
      completedLast30Days: completedLast.length,
      avgResolutionHours: Math.round(avgLast * 10) / 10,
      activeWorkers: workers.length,
      availableWorkers: available.length,
      trends: {
        // The open backlog has no history: this is requests CREATED last 30 vs previous 30 days.
        openRequests: pct(all.filter((sr) => last30(sr.createdAt)).length, all.filter((sr) => prev30(sr.createdAt)).length),
        completedLast30Days: pct(completedLast.length, completedPrev.length),
        avgResolutionHours: completedPrev.length === 0 ? 0 : pct(avgLast, avgPrev),
      },
    }
    return HttpResponse.json(stats)
  }),

  // GET /api/dashboard/status-breakdown (WorkerOrAdmin) — exactly five rows, statuses 1..5, zero-filled
  http.get('/api/dashboard/status-breakdown', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const all = tenantRequests(auth.tenantId)
    const statuses = [ServiceRequestStatus.Pending, ServiceRequestStatus.Assigned, ServiceRequestStatus.InProgress, ServiceRequestStatus.Completed, ServiceRequestStatus.Cancelled]
    const result: StatusBreakdown[] = statuses.map((status) => ({ status, count: all.filter((sr) => sr.status === status).length }))
    return HttpResponse.json(result)
  }),

  // GET /api/dashboard/volume?days (WorkerOrAdmin) — days clamped [7, 90] (non-numeric → 30); exactly `days` UTC points ending today
  http.get('/api/dashboard/volume', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const days = clampParam(new URL(request.url).searchParams.get('days'), 30, 7, 90)
    const created = new Map<string, number>()
    const completed = new Map<string, number>()
    for (const sr of tenantRequests(auth.tenantId)) created.set(sr.createdAt.slice(0, 10), (created.get(sr.createdAt.slice(0, 10)) ?? 0) + 1)
    for (const l of db.serviceLogs) {
      if (l.tenantId !== auth.tenantId || l.isDeleted || l.newStatus !== ServiceRequestStatus.Completed) continue
      const key = new Date(l.createdAt).toISOString().slice(0, 10)
      completed.set(key, (completed.get(key) ?? 0) + 1)
    }
    const now = new Date()
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    const points: DailyVolumePoint[] = Array.from({ length: days }, (_, i) => {
      const date = new Date(todayUtc - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10)
      return { date, created: created.get(date) ?? 0, completed: completed.get(date) ?? 0 }
    })
    return HttpResponse.json(points)
  }),

  // GET /api/dashboard/activity?limit (WorkerOrAdmin) — limit clamped [1, 50] (non-numeric → 10), newest first
  http.get('/api/dashboard/activity', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const limit = clampParam(new URL(request.url).searchParams.get('limit'), 10, 1, 50)
    const requests = new Map(tenantRequests(auth.tenantId).map((sr) => [sr.id, sr]))
    const newestFirst = (a: ActivityItem, b: ActivityItem) => b.occurredAt.localeCompare(a.occurredAt)
    const fromLogs: ActivityItem[] = db.serviceLogs
      .filter((l) => l.tenantId === auth.tenantId && !l.isDeleted && requests.has(l.serviceRequestId))
      .map((l): ActivityItem => ({
        id: l.id,
        type:
          l.newStatus === ServiceRequestStatus.Assigned
            ? 'assigned'
            : l.newStatus === ServiceRequestStatus.Completed
              ? 'completed'
              : l.newStatus === ServiceRequestStatus.Cancelled
                ? 'cancelled'
                : 'status_changed',
        serviceRequestId: l.serviceRequestId,
        serviceRequestTitle: requests.get(l.serviceRequestId)!.title,
        actorName: displayName(l.changedByUserId),
        occurredAt: l.createdAt,
        detail: l.notes?.trim() ? l.notes : `${STATUS_NAMES[l.previousStatus]} → ${STATUS_NAMES[l.newStatus]}`,
      }))
      .sort(newestFirst)
      .slice(0, limit)
    const fromCreated: ActivityItem[] = [...requests.values()]
      .map((sr): ActivityItem => ({
        id: `created:${sr.id}`,
        type: 'created',
        serviceRequestId: sr.id,
        serviceRequestTitle: sr.title,
        actorName: displayName(sr.customerId),
        occurredAt: sr.createdAt,
        detail: null,
      }))
      .sort(newestFirst)
      .slice(0, limit)
    return HttpResponse.json([...fromLogs, ...fromCreated].sort(newestFirst).slice(0, limit))
  }),

  // GET /api/tenants/current (any role)
  http.get('/api/tenants/current', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    if (db.tenant.id !== auth.tenantId) return errors.notFound('Tenant', auth.tenantId)
    return HttpResponse.json(db.tenant)
  }),

  // PUT /api/tenants/current (AdminOnly) — full replacement, trimmed, empty → null; `plan` is read-only
  http.put('/api/tenants/current', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.AdminOnly])
    if (isResponse(auth)) return auth
    if (db.tenant.id !== auth.tenantId) return errors.notFound('Tenant', auth.tenantId)
    const body = ((await request.json()) ?? {}) as Partial<UpdateTenantRequest>
    const name = body.name?.trim() ?? ''
    const description = normalize(body.description)
    const contactEmail = normalize(body.contactEmail)
    const phone = normalize(body.phone)
    const address = normalize(body.address)
    const timezone = body.timezone?.trim() ?? ''
    if (!name) return errors.badRequest(TenantErrorCodes.NameRequired, 'Tenant name is required.')
    if (name.length > TENANT_NAME_MAX_LENGTH)
      return errors.badRequest(TenantErrorCodes.NameTooLong, `Tenant name cannot be longer than ${TENANT_NAME_MAX_LENGTH} characters.`)
    if (description && description.length > TENANT_DESCRIPTION_MAX_LENGTH)
      return errors.badRequest(TenantErrorCodes.DescriptionTooLong, `Tenant description cannot be longer than ${TENANT_DESCRIPTION_MAX_LENGTH} characters.`)
    if (contactEmail && (contactEmail.length > TENANT_CONTACT_EMAIL_MAX_LENGTH || !isContactEmail(contactEmail)))
      return errors.badRequest(TenantErrorCodes.ContactEmailInvalid, `Contact email '${contactEmail}' is invalid.`)
    if (phone && phone.length > TENANT_PHONE_MAX_LENGTH)
      return errors.badRequest(TenantErrorCodes.PhoneTooLong, `Phone cannot be longer than ${TENANT_PHONE_MAX_LENGTH} characters.`)
    if (address && address.length > TENANT_ADDRESS_MAX_LENGTH)
      return errors.badRequest(TenantErrorCodes.AddressTooLong, `Address cannot be longer than ${TENANT_ADDRESS_MAX_LENGTH} characters.`)
    if (!timezone || !isKnownTimezone(timezone))
      return errors.badRequest(TenantErrorCodes.TimezoneInvalid, `Timezone '${timezone}' is not a known IANA time zone id.`)
    Object.assign(db.tenant, { name, description, contactEmail, phone, address, timezone })
    return HttpResponse.json(db.tenant)
  }),

  // GET /health
  http.get('/health', () => HttpResponse.text('Healthy')),
]
