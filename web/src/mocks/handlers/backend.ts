/**
 * Handlers for endpoints that EXIST on the backend. Registered only in mock mode
 * (in live mode these requests go to the real API through the Vite proxy).
 * Behaviour mirrors the controllers + use-case handlers (policies, validation, domain rules).
 */
import { delay, http, HttpResponse } from 'msw'
import { parseStatus } from '@/shared/lib'
import {
  ServiceRequestStatus,
  UserRole,
  type AssignWorkerRequest,
  type ChangeServiceStatusRequest,
  type CreateServiceRequestRequest,
  type LoginRequest,
  type LoginResponse,
  type ServiceRequest,
} from '@/shared/types'
import { authorize, errors, isResponse, issueMockToken, Policies } from '../auth'
import { db, findServiceRequest, findUser, findUserByEmail, newId, nowIso, paginate, pushNotification } from '../db'

const LATENCY = () => delay(250 + Math.random() * 250)

export const backendHandlers = [
  // POST /api/auth/login — no password verification (matches backend Phase 4 placeholder)
  http.post('/api/auth/login', async ({ request }) => {
    await LATENCY()
    const body = (await request.json()) as Partial<LoginRequest>
    const user = body.email ? findUserByEmail(body.email) : null
    if (!user || !user.isActive) return errors.unauthorized()
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

    let items = db.serviceRequests.filter((sr) => sr.tenantId === auth.tenantId && !sr.isDeleted)
    if (status) items = items.filter((sr) => sr.status === status)
    if (assignedWorkerId) items = items.filter((sr) => sr.assignedWorkerId === assignedWorkerId)
    return HttpResponse.json(paginate(items, page, pageSize))
  }),

  // GET /api/service-requests/{id}
  http.get('/api/service-requests/:id', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    const sr = findServiceRequest(String(params.id))
    if (!sr || sr.tenantId !== auth.tenantId) return errors.notFound('ServiceRequest', String(params.id))
    return HttpResponse.json(sr)
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
    // Note: the real backend's AssignWorker does NOT write a ServiceLog today; the mock does, for a richer timeline.
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

  // GET /api/users/workers (WorkerOrAdmin)
  http.get('/api/users/workers', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request, [...Policies.WorkerOrAdmin])
    if (isResponse(auth)) return auth
    const url = new URL(request.url)
    const items = db.users.filter((u) => u.tenantId === auth.tenantId && !u.isDeleted && u.role === UserRole.Worker)
    return HttpResponse.json(paginate(items, Number(url.searchParams.get('page') ?? 1), Number(url.searchParams.get('pageSize') ?? 10)))
  }),

  // GET /health
  http.get('/health', () => HttpResponse.text('Healthy')),
]
