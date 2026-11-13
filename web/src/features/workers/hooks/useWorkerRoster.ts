import { useMemo } from 'react'
import { useWorkers } from '@/features/users/hooks'
import type { User, WorkerProfile } from '@/shared/types'
import type { WorkerWorkload } from '../api/workersApi'
import { useWorkerProfiles, useWorkerWorkload } from './useWorkerProfiles'

export interface WorkerRosterEntry {
  user: User
  profile: WorkerProfile | null
  workload: WorkerWorkload | null
}

/**
 * Joins the worker list (✅ GET /api/users/workers) with profiles (✅ GET /api/workers/profiles)
 * and workload (✅ GET /api/workers/workload), keyed by userId.
 */
export function useWorkerRoster() {
  const workersQuery = useWorkers({ page: 1, pageSize: 100 })
  const profilesQuery = useWorkerProfiles()
  const workloadQuery = useWorkerWorkload()

  const entries = useMemo<WorkerRosterEntry[]>(() => {
    const profiles = new Map((profilesQuery.data ?? []).map((p) => [p.userId, p]))
    const workload = new Map((workloadQuery.data ?? []).map((w) => [w.workerId, w]))
    return (workersQuery.data?.items ?? []).map((user) => ({
      user,
      profile: profiles.get(user.id) ?? null,
      workload: workload.get(user.id) ?? null,
    }))
  }, [workersQuery.data, profilesQuery.data, workloadQuery.data])

  return {
    entries,
    workersQuery,
    profilesQuery,
    workloadQuery,
    /** Profile / workload enrichments still loading (people are already rendered). */
    extrasLoading: profilesQuery.isLoading || workloadQuery.isLoading,
  }
}
