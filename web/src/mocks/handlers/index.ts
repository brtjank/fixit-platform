import { isMockMode } from '@/shared/config/env'
import { backendHandlers } from './backend'
import { mockOnlyHandlers } from './mockOnly'

/**
 * Order matters: backend routes first so /api/users/workers wins over /api/users/:id.
 * In live mode the backend handlers are absent and /api/users/:id passes `workers`/`me` through.
 */
export const handlers = [...(isMockMode ? backendHandlers : []), ...mockOnlyHandlers]
