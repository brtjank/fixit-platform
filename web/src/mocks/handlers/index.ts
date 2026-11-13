import { isMockMode } from '@/shared/config/env'
import { backendHandlers } from './backend'
import { mockOnlyHandlers } from './mockOnly'

/**
 * Backend handlers first (mock mode only). Within backend.ts, /api/users/me, /api/users/me/notification-preferences
 * and /api/users/workers are registered before /api/users/:id, and PUT /api/users/me/password before
 * /api/users/:id/password (first match wins). mockOnly.ts only has /api/notifications*, so in live mode every
 * other request goes straight to the real API.
 */
export const handlers = [...(isMockMode ? backendHandlers : []), ...mockOnlyHandlers]
