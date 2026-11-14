import { backendHandlers } from './backend'

/**
 * Mock mode only (main.tsx does not start MSW in live mode — every endpoint exists on the backend).
 * Within backend.ts, /api/users/me, /api/users/me/notification-preferences and /api/users/workers are registered
 * before /api/users/:id, and PUT /api/users/me/password before /api/users/:id/password (first match wins).
 */
export const handlers = [...backendHandlers]
