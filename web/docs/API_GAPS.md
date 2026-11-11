# API gaps — endpoints the UI needs that the backend does not have yet

The frontend mocks these with MSW (in **both** API modes). Each is a proposal for a future backend
endpoint, shaped to fit the existing conventions (camelCase JSON, numeric enums, `Paged<T>` envelope,
`{ errorCode, message, requestId }` errors, policies).

| Endpoint | Policy | Purpose / proposed contract | Used by |
| --- | --- | --- | --- |
| `GET /api/users/me` | any | Profile of the signed-in user (`User` + `tenantName`). Today Worker/Customer cannot read their own name (`GET /api/users` is AdminOnly). | Topbar, Settings |
| `GET /api/service-requests/{id}/logs` | any (tenant-scoped) | `ServiceLog[]` history for the timeline. Entity + repository exist; no endpoint. | Request detail |
| `GET /api/users/{id}` | any | Single user (resolve customer/worker names on detail pages). | Request detail, worker detail |
| `POST /api/users` | AdminOnly | Invite/create user `{ email, firstName, lastName, role }`. | Users |
| `PUT /api/users/{id}` | AdminOnly | Update name/role. | Users |
| `PUT /api/users/{id}/activate` / `deactivate` | AdminOnly | Toggle `IsActive` (domain methods exist). | Users |
| `GET /api/workers/profiles` | WorkerOrAdmin | All `WorkerProfile`s (specialization, phone, availability). | Workers |
| `GET/PUT /api/workers/{userId}/profile` | WorkerOrAdmin (worker: self only) | Read/update one profile. | Worker detail |
| `GET /api/workers/workload` | WorkerOrAdmin | `{ workerId, open, inProgress, completedLast30Days }[]`. | Workers, dashboard |
| `GET /api/dashboard/stats` | WorkerOrAdmin | KPIs + 30-day trends. | Dashboard |
| `GET /api/dashboard/status-breakdown` | WorkerOrAdmin | `{ status, count }[]`. | Dashboard |
| `GET /api/dashboard/volume?days=30` | WorkerOrAdmin | `{ date, created, completed }[]`. | Dashboard |
| `GET /api/dashboard/activity?limit=10` | WorkerOrAdmin | Recent events across requests. | Dashboard |
| `GET/PUT /api/tenants/current` | any / AdminOnly | Organization settings. | Settings |
| `GET/PUT /api/users/me/notification-preferences` | any | Per-user email preferences. | Settings |
| `GET /api/notifications`, `PUT …/{id}/read`, `PUT …/read-all` | any | In-app notifications (natural consumer of the Phase 5 `ServiceRequestStatusChanged` event). | Topbar, Notifications |

## Behavioural gaps in existing endpoints (worked around client-side)

| Gap | Workaround in the UI |
| --- | --- |
| `GET /api/service-requests` has no `customerId` filter and returns **all** tenant requests to a Customer. | "My requests" filters by `customerId === session.userId` on the client (page size 100). Proposed: `?customerId=` + implicit scoping for the Customer role in the handler. |
| `GET /api/service-requests` has no search/sort. | Title search is client-side within the current page. Proposed: `?search=` and `?sort=`. |
| `POST /api/auth/login` does not verify passwords (Phase 4 placeholder). | Login form still requires a password; any value works. Demo accounts are listed on the login page. |
| `AssignWorker` does not write a `ServiceLog`. | The mock does, so the timeline shows assignments. Proposed: log the Pending→Assigned transition (or emit it via the Phase 5 event). |
| No CORS configuration. | Vite dev proxy (`/api` → `http://localhost:5177`). Production would need `AddCors` or same-origin hosting. |
| Enums serialize as integers. | Types use numeric enums; `status` query param is sent as the number (backend `Enum.Parse` accepts it). Consider `JsonStringEnumConverter` for readability. |
| No seed data / registration. | `dev/seed.sql` inserts the demo tenant + users for live mode. |
