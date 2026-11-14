/**
 * Handlers for endpoints the backend DOES NOT HAVE YET. Registered in BOTH modes.
 * Each one is documented in docs/API_GAPS.md as a proposed backend endpoint.
 * In live mode they decode the real JWT and answer from the in-memory dataset.
 * Only the in-app notifications remain (they wait for the Phase 5 ServiceRequestStatusChanged event).
 */
import { delay, http, HttpResponse } from 'msw'
import { authorize, isResponse, errors } from '../auth'
import { db, nowIso } from '../db'

const LATENCY = () => delay(200 + Math.random() * 200)

export const mockOnlyHandlers = [
  // ---- Notifications -----------------------------------------------------------
  http.get('/api/notifications', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    return HttpResponse.json(db.notifications.slice(0, 20))
  }),
  http.put('/api/notifications/read-all', async ({ request }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    let updated = 0
    for (const n of db.notifications) if (!n.readAt) { n.readAt = nowIso(); updated++ }
    return HttpResponse.json({ updated })
  }),
  http.put('/api/notifications/:id/read', async ({ request, params }) => {
    await LATENCY()
    const auth = authorize(request)
    if (isResponse(auth)) return auth
    const n = db.notifications.find((x) => x.id === String(params.id))
    if (!n) return errors.notFound('Notification', String(params.id))
    n.readAt = n.readAt ?? nowIso()
    return HttpResponse.json(n)
  }),
]
