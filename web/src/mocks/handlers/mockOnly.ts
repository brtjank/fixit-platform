/**
 * Handlers for endpoints the backend DOES NOT HAVE YET. Registered in BOTH modes.
 * Each one is documented in docs/API_GAPS.md as a proposed backend endpoint.
 * In live mode they decode the real JWT and answer from the in-memory dataset.
 */
import { delay, http, HttpResponse, passthrough } from 'msw'
import type { DashboardStats, StatusBreakdown, DailyVolumePoint, ActivityItem } from '@/features/dashboard/api/dashboardApi'
import type { InviteUserRequest, UpdateUserRequest } from '@/features/users/api/usersApi'
import type { UpdateWorkerProfileRequest, WorkerWorkload } from '@/features/workers/api/workersApi'
import type { NotificationPreferences, UpdateTenantRequest } from '@/features/settings/api/settingsApi'
import { parseRole } from '@/shared/lib'
import { ServiceRequestStatus, UserRole, type User, type WorkerProfile } from '@/shared/types'
import { authorize, isResponse, errors, Policies } from '../auth'
import { db, findUser, newId, nowIso } from '../db'

const LATENCY = () => delay(200 + Math.random() * 200)
const STATUS_NAMES = ['', 'Pending', 'Assigned', 'InProgress', 'Completed', 'Cancelled']
const OPEN: ServiceRequestStatus[] = [ServiceRequestStatus.Pending, ServiceRequestStatus.Assigned, ServiceRequestStatus.InProgress]

export const mockOnlyHandlers = [
  // ---- Current user preferences -------------------------------------------
  http.get('/api/users/me/notification-preferences', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    return HttpResponse.json(db.notificationPreferences)
  }),
  http.put('/api/users/me/notification-preferences', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    const body = (await request.json()) as NotificationPreferences
    db.notificationPreferences = { ...db.notificationPreferences, ...body }
    return HttpResponse.json(db.notificationPreferences)
  }),

  // ---- User management (Admin) ------------------------------------------------
  http.get('/api/users/:id', async ({ request, params }) => {
    // Reserved sub-routes served by the backend (mock backend handlers in mock mode, real API in live mode).
    if (['workers', 'me'].includes(String(params.id))) return passthrough()
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    const user = findUser(String(params.id))
    if (!user || user.tenantId !== auth.tenantId) return errors.notFound('User', String(params.id))
    return HttpResponse.json(user)
  }),
  http.post('/api/users', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.AdminOnly])
    if (isResponse(auth)) return auth
    const body = (await request.json()) as Partial<InviteUserRequest>
    const role = parseRole(body.role)
    if (!body.email?.includes('@')) return errors.badRequest('VAL_001_VALIDATION', 'A valid email is required.')
    if (!body.firstName?.trim() || !body.lastName?.trim()) return errors.badRequest('VAL_001_VALIDATION', 'First and last name are required.')
    if (!role) return errors.badRequest('VAL_001_VALIDATION', 'Role is invalid.')
    if (db.users.some((u) => u.email.toLowerCase() === body.email!.toLowerCase() && !u.isDeleted))
      return errors.badRequest('USR_005_EMAIL_TAKEN', `A user with email ${body.email} already exists.`)
    const user: User = { id: newId(), tenantId: auth.tenantId, email: body.email.trim(), firstName: body.firstName.trim(), lastName: body.lastName.trim(), role, isActive: true, createdAt: nowIso(), isDeleted: false }
    db.users.push(user)
    if (role === UserRole.Worker) {
      db.workerProfiles.push({ id: newId(), tenantId: auth.tenantId, userId: user.id, specialization: null, phoneNumber: null, isAvailable: true, createdAt: nowIso(), isDeleted: false })
    }
    return HttpResponse.json(user, { status: 201 })
  }),
  http.put('/api/users/:id', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.AdminOnly])
    if (isResponse(auth)) return auth
    const user = findUser(String(params.id))
    if (!user || user.tenantId !== auth.tenantId) return errors.notFound('User', String(params.id))
    const body = (await request.json()) as Partial<UpdateUserRequest>
    if (body.firstName?.trim()) user.firstName = body.firstName.trim()
    if (body.lastName?.trim()) user.lastName = body.lastName.trim()
    const role = parseRole(body.role)
    if (role) user.role = role
    return HttpResponse.json(user)
  }),
  http.put('/api/users/:id/deactivate', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.AdminOnly])
    if (isResponse(auth)) return auth
    const user = findUser(String(params.id))
    if (!user || user.tenantId !== auth.tenantId) return errors.notFound('User', String(params.id))
    if (user.id === auth.userId) return errors.badRequest('USR_006_SELF_DEACTIVATE', 'You cannot deactivate your own account.')
    user.isActive = false
    return HttpResponse.json(user)
  }),
  http.put('/api/users/:id/activate', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.AdminOnly])
    if (isResponse(auth)) return auth
    const user = findUser(String(params.id))
    if (!user || user.tenantId !== auth.tenantId) return errors.notFound('User', String(params.id))
    user.isActive = true
    return HttpResponse.json(user)
  }),

  // ---- Worker profiles ---------------------------------------------------------
  http.get('/api/workers/profiles', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    return HttpResponse.json(db.workerProfiles.filter((p) => p.tenantId === auth.tenantId && !p.isDeleted))
  }),
  http.get('/api/workers/workload', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const cutoff = Date.now() - 30 * 86_400_000
    const result: WorkerWorkload[] = db.users
      .filter((u) => u.role === UserRole.Worker && !u.isDeleted)
      .map((w) => {
        const mine = db.serviceRequests.filter((sr) => sr.assignedWorkerId === w.id && !sr.isDeleted)
        return {
          workerId: w.id,
          open: mine.filter((sr) => sr.status === ServiceRequestStatus.Assigned || sr.status === ServiceRequestStatus.InProgress).length,
          inProgress: mine.filter((sr) => sr.status === ServiceRequestStatus.InProgress).length,
          completedLast30Days: mine.filter((sr) => sr.status === ServiceRequestStatus.Completed && new Date(sr.createdAt).getTime() > cutoff).length,
        }
      })
    return HttpResponse.json(result)
  }),
  http.get('/api/workers/:userId/profile', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    const profile = db.workerProfiles.find((p) => p.userId === String(params.userId) && !p.isDeleted)
    if (!profile) return errors.notFound('WorkerProfile', String(params.userId))
    return HttpResponse.json(profile)
  }),
  http.put('/api/workers/:userId/profile', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const userId = String(params.userId)
    if (auth.role === UserRole.Worker && auth.userId !== userId) return errors.forbidden()
    let profile = db.workerProfiles.find((p) => p.userId === userId && !p.isDeleted)
    const body = (await request.json()) as Partial<UpdateWorkerProfileRequest>
    if (!profile) {
      const created: WorkerProfile = { id: newId(), tenantId: auth.tenantId, userId, specialization: null, phoneNumber: null, isAvailable: true, createdAt: nowIso(), isDeleted: false }
      db.workerProfiles.push(created)
      profile = created
    }
    if (body.specialization !== undefined) profile.specialization = body.specialization || null
    if (body.phoneNumber !== undefined) profile.phoneNumber = body.phoneNumber || null
    if (typeof body.isAvailable === 'boolean') profile.isAvailable = body.isAvailable
    return HttpResponse.json(profile)
  }),

  // ---- Dashboard ---------------------------------------------------------------
  http.get('/api/dashboard/stats', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const all = db.serviceRequests.filter((sr) => !sr.isDeleted)
    const now = Date.now()
    const d30 = now - 30 * 86_400_000
    const d60 = now - 60 * 86_400_000
    const completed = all.filter((sr) => sr.status === ServiceRequestStatus.Completed)
    const completedLast30 = completed.filter((sr) => new Date(sr.createdAt).getTime() > d30)
    const completedPrev30 = completed.filter((sr) => { const t = new Date(sr.createdAt).getTime(); return t > d60 && t <= d30 })
    const open = all.filter((sr) => OPEN.includes(sr.status))
    const resolutionHours = (list: typeof all) =>
      list.length === 0
        ? 0
        : list.reduce((sum, sr) => {
            const done = db.serviceLogs.find((l) => l.serviceRequestId === sr.id && l.newStatus === ServiceRequestStatus.Completed)
            return sum + (done ? (new Date(done.createdAt).getTime() - new Date(sr.createdAt).getTime()) / 3_600_000 : 48)
          }, 0) / list.length
    const workers = db.users.filter((u) => u.role === UserRole.Worker && u.isActive && !u.isDeleted)
    const available = workers.filter((w) => db.workerProfiles.find((p) => p.userId === w.id)?.isAvailable !== false)
    const pct = (cur: number, prev: number) => (prev === 0 ? (cur === 0 ? 0 : 100) : Math.round(((cur - prev) / prev) * 1000) / 10)
    const avgNow = resolutionHours(completedLast30)
    const avgPrev = resolutionHours(completedPrev30)
    const stats: DashboardStats = {
      openRequests: open.length,
      pendingUnassigned: all.filter((sr) => sr.status === ServiceRequestStatus.Pending).length,
      inProgress: all.filter((sr) => sr.status === ServiceRequestStatus.InProgress).length,
      completedLast30Days: completedLast30.length,
      avgResolutionHours: Math.round(avgNow * 10) / 10,
      activeWorkers: workers.length,
      availableWorkers: available.length,
      trends: {
        openRequests: pct(open.length, Math.max(1, open.length - 2)),
        completedLast30Days: pct(completedLast30.length, completedPrev30.length),
        avgResolutionHours: pct(avgNow, avgPrev || avgNow),
      },
    }
    return HttpResponse.json(stats)
  }),
  http.get('/api/dashboard/status-breakdown', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const all = db.serviceRequests.filter((sr) => !sr.isDeleted)
    const result: StatusBreakdown[] = ([1, 2, 3, 4, 5] as ServiceRequestStatus[]).map((status) => ({ status, count: all.filter((sr) => sr.status === status).length }))
    return HttpResponse.json(result)
  }),
  http.get('/api/dashboard/volume', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const days = Math.min(90, Math.max(7, Number(new URL(request.url).searchParams.get('days') ?? 30)))
    const points: DailyVolumePoint[] = []
    const dayKey = (iso: string) => iso.slice(0, 10)
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
      points.push({
        date,
        created: db.serviceRequests.filter((sr) => dayKey(sr.createdAt) === date).length,
        completed: db.serviceLogs.filter((l) => l.newStatus === ServiceRequestStatus.Completed && dayKey(l.createdAt) === date).length,
      })
    }
    return HttpResponse.json(points)
  }),
  http.get('/api/dashboard/activity', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const limit = Number(new URL(request.url).searchParams.get('limit') ?? 10)
    const name = (id: string | null) => { const u = id ? findUser(id) : null; return u ? `${u.firstName} ${u.lastName}` : 'System' }
    const fromLogs: ActivityItem[] = db.serviceLogs.map((l) => {
      const sr = db.serviceRequests.find((s) => s.id === l.serviceRequestId)
      const type: ActivityItem['type'] = l.newStatus === ServiceRequestStatus.Assigned ? 'assigned' : l.newStatus === ServiceRequestStatus.Completed ? 'completed' : l.newStatus === ServiceRequestStatus.Cancelled ? 'cancelled' : 'status_changed'
      return { id: l.id, type, serviceRequestId: l.serviceRequestId, serviceRequestTitle: sr?.title ?? 'Service request', actorName: name(l.changedByUserId), occurredAt: l.createdAt, detail: l.notes ?? `${STATUS_NAMES[l.previousStatus]} → ${STATUS_NAMES[l.newStatus]}` }
    })
    const fromCreated: ActivityItem[] = db.serviceRequests.map((sr) => ({ id: `created:${sr.id}`, type: 'created', serviceRequestId: sr.id, serviceRequestTitle: sr.title, actorName: name(sr.customerId), occurredAt: sr.createdAt }))
    const items = [...fromLogs, ...fromCreated].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, limit)
    return HttpResponse.json(items)
  }),

  // ---- Tenant settings ---------------------------------------------------------
  http.get('/api/tenants/current', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    return HttpResponse.json(db.tenantSettings)
  }),
  http.put('/api/tenants/current', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.AdminOnly])
    if (isResponse(auth)) return auth
    const body = (await request.json()) as Partial<UpdateTenantRequest>
    if (!body.name?.trim()) return errors.badRequest('TEN_001_NAME_REQUIRED', 'Tenant name is required.')
    Object.assign(db.tenantSettings, { ...body, name: body.name.trim() })
    db.tenant.name = db.tenantSettings.name
    return HttpResponse.json(db.tenantSettings)
  }),

  // ---- Notifications -----------------------------------------------------------
  http.get('/api/notifications', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    return HttpResponse.json(db.notifications.slice(0, 20))
  }),
  http.put('/api/notifications/read-all', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    let updated = 0
    for (const n of db.notifications) if (!n.readAt) { n.readAt = nowIso(); updated++ }
    return HttpResponse.json({ updated })
  }),
  http.put('/api/notifications/:id/read', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    const n = db.notifications.find((x) => x.id === String(params.id))
    if (!n) return errors.notFound('Notification', String(params.id))
    n.readAt = n.readAt ?? nowIso()
    return HttpResponse.json(n)
  }),
]
