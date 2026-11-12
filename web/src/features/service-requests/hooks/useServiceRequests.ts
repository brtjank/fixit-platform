import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { i18n } from '@/i18n'
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

/** ✅ real endpoint (ServiceLog history) */
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
      toast.success(i18n.t('requests:toasts.created'))
    },
    onError: (e) => toast.error(errorMessage(e, i18n.t('requests:toasts.createError'))),
  })
}

/** ✅ real endpoint — PUT /api/service-requests/{id}/assign-worker */
export function useAssignWorker() {
  const invalidate = useInvalidateServiceRequests()
  return useMutation({
    mutationFn: ({ id, workerId }: { id: string; workerId: string }) => serviceRequestsApi.assignWorker(id, workerId),
    onSuccess: (_, { id }) => {
      invalidate(id)
      toast.success(i18n.t('requests:toasts.assigned'))
    },
    onError: (e) => toast.error(errorMessage(e, i18n.t('requests:toasts.assignError'))),
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
      toast.success(i18n.t('requests:toasts.statusUpdated'))
    },
    onError: (e) => toast.error(errorMessage(e, i18n.t('requests:toasts.statusError'))),
  })
}
