import { http } from '@/shared/api'
import type { WorkerProfile } from '@/shared/types'

/** Backend limits (longer → 400 WRK_001_SPECIALIZATION_TOO_LONG / WRK_002_PHONE_TOO_LONG). */
export const WORKER_SPECIALIZATION_MAX_LENGTH = 200
export const WORKER_PHONE_MAX_LENGTH = 20

/** ✅ Body of PUT /api/workers/{userId}/profile — full replacement; strings are trimmed, empty → null. */
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

/**
 * Workers API.
 * ✅ = real backend endpoint   ⚠ = MOCK-ONLY (see docs/API_GAPS.md)
 */
export const workersApi = {
  /** ✅ GET /api/workers/profiles  (policy: WorkerOrAdmin) — plain array, ordered by createdAt */
  profiles: () => http.get<WorkerProfile[]>('/api/workers/profiles'),

  /** ✅ GET /api/workers/{userId}/profile  (any role; 404 when the user has no profile) */
  profile: (userId: string) => http.get<WorkerProfile>(`/api/workers/${userId}/profile`),

  /** ✅ PUT /api/workers/{userId}/profile  (policy: WorkerOrAdmin; a Worker only for themselves, else 404). Upsert, always 200. */
  updateProfile: (userId: string, body: UpdateWorkerProfileRequest) =>
    http.put<WorkerProfile>(`/api/workers/${userId}/profile`, body),

  /** ⚠ GET /api/workers/workload — MOCK-ONLY. Counts per worker. */
  workload: () => http.get<WorkerWorkload[]>('/api/workers/workload'),
}
