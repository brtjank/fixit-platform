import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { i18n } from '@/i18n'
import { errorMessage } from '@/shared/api'
import { workersApi, type UpdateWorkerProfileRequest } from '../api/workersApi'

/** Profiles and workload: ✅ real endpoints. */
export const workerKeys = {
  all: ['workers'] as const,
  profiles: () => [...workerKeys.all, 'profiles'] as const,
  profile: (userId: string) => [...workerKeys.all, 'profile', userId] as const,
  workload: () => [...workerKeys.all, 'workload'] as const,
}

export function useWorkerProfiles(options?: { enabled?: boolean }) {
  return useQuery({ queryKey: workerKeys.profiles(), queryFn: workersApi.profiles, enabled: options?.enabled ?? true })
}

export function useWorkerProfile(userId: string | undefined) {
  return useQuery({ queryKey: workerKeys.profile(userId ?? ''), queryFn: () => workersApi.profile(userId!), enabled: Boolean(userId) })
}

export function useWorkerWorkload(options?: { enabled?: boolean }) {
  return useQuery({ queryKey: workerKeys.workload(), queryFn: workersApi.workload, enabled: options?.enabled ?? true })
}

export function useUpdateWorkerProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: UpdateWorkerProfileRequest }) => workersApi.updateProfile(userId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: workerKeys.all })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(i18n.t('workers:toasts.profileUpdated'))
    },
    onError: (e) => toast.error(errorMessage(e, i18n.t('workers:toasts.profileUpdateError'))),
  })
}
