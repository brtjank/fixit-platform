import { isMockMode } from '@/shared/config/env'
import { backendHandlers } from './backend'
import { mockOnlyHandlers } from './mockOnly'

/**
 * Order matters: backend routes first so /api/users/workers and /api/users/me win over /api/users/:id.
 * In live mode the backend handlers are absent and /api/users/:id passes `workers`/`me` through to the real API.
 */
export const handlers = [...(isMockMode ? backendHandlers : []), ...mockOnlyHandlers]
