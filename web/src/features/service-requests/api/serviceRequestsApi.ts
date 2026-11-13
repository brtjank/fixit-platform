import { http } from '@/shared/api'
import type {
  AssignWorkerResponse,
  ChangeServiceStatusResponse,
  CreateServiceRequestRequest,
  CreateServiceRequestResponse,
  Paged,
  ServiceLog,
  ServiceRequest,
  ServiceRequestListParams,
  ServiceRequestStatus,
} from '@/shared/types'

/**
 * Service requests API.
 * ✅ = real backend endpoint   ⚠ = MOCK-ONLY (see docs/API_GAPS.md)
 */
export const serviceRequestsApi = {
  /**
   * ✅ GET /api/service-requests?page&pageSize&status&assignedWorkerId&customerId&search&sort
   * (Customer role is always scoped to own requests). `search` matches title OR description,
   * `sort` = `createdAt|title|status:asc|desc` (default createdAt:desc). Empty values are omitted.
   */
  list: (params: ServiceRequestListParams = {}) =>
    http.get<Paged<ServiceRequest>>('/api/service-requests', {
      query: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        status: params.status, // backend parses enum name or number (Enum.Parse)
        assignedWorkerId: params.assignedWorkerId,
        customerId: params.customerId,
        search: params.search?.trim() || undefined,
        sort: params.sort,
      },
    }),

  /** ✅ GET /api/service-requests/{id} */
  getById: (id: string) => http.get<ServiceRequest>(`/api/service-requests/${id}`),

  /** ✅ POST /api/service-requests  (policy: CustomerOrAdmin) */
  create: (body: CreateServiceRequestRequest) =>
    http.post<CreateServiceRequestResponse>('/api/service-requests', body),

  /** ✅ PUT /api/service-requests/{id}/assign-worker  (policy: WorkerOrAdmin; request must be Pending) */
  assignWorker: (id: string, workerId: string) =>
    http.put<AssignWorkerResponse>(`/api/service-requests/${id}/assign-worker`, {
      serviceRequestId: id,
      workerId,
    }),

  /** ✅ PUT /api/service-requests/{id}/change-status  (policy: WorkerOrAdmin) */
  changeStatus: (id: string, newStatus: ServiceRequestStatus, notes?: string | null) =>
    http.put<ChangeServiceStatusResponse>(`/api/service-requests/${id}/change-status`, {
      serviceRequestId: id,
      newStatus,
      notes: notes || null,
    }),

  /** ✅ GET /api/service-requests/{id}/logs — status history, ordered by createdAt ascending */
  logs: (id: string) => http.get<ServiceLog[]>(`/api/service-requests/${id}/logs`),
}
