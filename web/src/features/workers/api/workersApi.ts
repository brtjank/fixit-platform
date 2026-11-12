import { http } from '@/shared/api'
import type { WorkerProfile } from '@/shared/types'

/** ⚠ MOCK-ONLY — WorkerProfile entity exists in the domain but has no endpoint yet. */
export interface UpdateWorkerProfileRequest {
  specialization: string | null
  phoneNumber: string | null
  isAvailable: boolean
}

export interface WorkerWorkload {
  workerId: string
  open: number
  inProgress: number
  completedLast30Days: number
}

export const workersApi = {
  /** ⚠ GET /api/workers/profiles — MOCK-ONLY. All profiles for the tenant. */
  profiles: () => http.get<WorkerProfile[]>('/api/workers/profiles'),

  /** ⚠ GET /api/workers/{userId}/profile — MOCK-ONLY */
  profile: (userId: string) => http.get<WorkerProfile>(`/api/workers/${userId}/profile`),

  /** ⚠ PUT /api/workers/{userId}/profile — MOCK-ONLY */
  updateProfile: (userId: string, body: UpdateWorkerProfileRequest) =>
    http.put<WorkerProfile>(`/api/workers/${userId}/profile`, body),

  /** ⚠ GET /api/workers/workload — MOCK-ONLY. Counts per worker. */
  workload: () => http.get<WorkerWorkload[]>('/api/workers/workload'),
}
