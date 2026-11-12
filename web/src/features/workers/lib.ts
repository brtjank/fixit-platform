import type { User, WorkerProfile } from '@/shared/types'

export function isWorkerAvailable(user: User, profile: WorkerProfile | null) {
  return user.isActive && Boolean(profile?.isAvailable)
}
