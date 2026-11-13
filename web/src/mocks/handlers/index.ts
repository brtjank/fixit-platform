import { isMockMode } from '@/shared/config/env'
import { backendHandlers } from './backend'
import { mockOnlyHandlers } from './mockOnly'

/**
 * Backend handlers first (mock mode only). Within backend.ts, /api/users/me and /api/users/workers are
 * registered before /api/users/:id (first match wins). mockOnly.ts has no GET /api/users/:id, so in live
 * mode those requests are not intercepted and go straight to the real API.
 */
export const handlers = [...(isMockMode ? backendHandlers : []), ...mockOnlyHandlers]
