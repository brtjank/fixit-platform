import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { errorMessage } from '@/shared/api'
import type { ServiceRequestListParams, ServiceRequestStatus } from '@/shared/types'
import { serviceRequestsApi } from '../api/serviceRequestsApi'

export const serviceRequestKeys = {
  all: ['service-requests'] as const,
  lists: () => [...serviceRequestKeys.all, 'list'] as const,
  list: (params: ServiceRequestListParams) => [...serviceRequestKeys.lists(), params] as const,
  details: () => [...serviceRequestKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceRequestKeys.details(), id] as const,
  logs: (id: string) => [...serviceRequestKeys.detail(id), 'logs'] as const,
}

/** ✅ real endpoint */
export function useServiceRequests(params: ServiceRequestListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: serviceRequestKeys.list(params),
    queryFn: () => serviceRequestsApi.list(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })
}

/** ✅ real endpoint */
export function useServiceRequest(id: string | undefined) {
  return useQuery({
    queryKey: serviceRequestKeys.detail(id ?? ''),
    queryFn: () => serviceRequestsApi.getById(id!),
    enabled: Boolean(id),
  })
}

/** ⚠ mock-only endpoint (ServiceLog history) */
export function useServiceRequestLogs(id: string | undefined) {
  return useQuery({
    queryKey: serviceRequestKeys.logs(id ?? ''),
    queryFn: () => serviceRequestsApi.logs(id!),
    enabled: Boolean(id),
  })
}

function useInvalidateServiceRequests() {
  const qc = useQueryClient()
  return (id?: string) => {
    void qc.invalidateQueries({ queryKey: serviceRequestKeys.lists() })
    if (id) void qc.invalidateQueries({ queryKey: serviceRequestKeys.detail(id) })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
    void qc.invalidateQueries({ queryKey: ['workers'] })
    void qc.invalidateQueries({ queryKey: ['notifications'] })
  }
}

/** ✅ real endpoint — POST /api/service-requests */
export function useCreateServiceRequest() {
  const invalidate = useInvalidateServiceRequests()
  return useMutation({
    mutationFn: serviceRequestsApi.create,
    onSuccess: () => {
      invalidate()
      toast.success('Service request created')
    },
    onError: (e) => toast.error(errorMessage(e, 'Could not create the request')),
  })
}

/** ✅ real endpoint — PUT /api/service-requests/{id}/assign-worker */
export function useAssignWorker() {
  const invalidate = useInvalidateServiceRequests()
  return useMutation({
    mutationFn: ({ id, workerId }: { id: string; workerId: string }) => serviceRequestsApi.assignWorker(id, workerId),
    onSuccess: (_, { id }) => {
      invalidate(id)
      toast.success('Worker assigned')
    },
    onError: (e) => toast.error(errorMessage(e, 'Could not assign the worker')),
  })
}

/** ✅ real endpoint — PUT /api/service-requests/{id}/change-status */
export function useChangeStatus() {
  const invalidate = useInvalidateServiceRequests()
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: ServiceRequestStatus; notes?: string | null }) =>
      serviceRequestsApi.changeStatus(id, status, notes),
    onSuccess: (_, { id }) => {
      invalidate(id)
      toast.success('Status updated')
    },
    onError: (e) => toast.error(errorMessage(e, 'Could not change the status')),
  })
}
