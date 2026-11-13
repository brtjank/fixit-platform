# API gaps — endpoints the UI needs that the backend does not have yet

The frontend mocks these with MSW (in **both** API modes). Each is a proposal for a future backend
endpoint, shaped to fit the existing conventions (camelCase JSON, numeric enums, `Paged<T>` envelope,
`{ errorCode, message, requestId }` errors, policies).

| Endpoint | Policy | Purpose / proposed contract | Used by |
| --- | --- | --- | --- |
| `POST /api/users` | AdminOnly | Invite/create user `{ email, firstName, lastName, role }`. | Users |
| `PUT /api/users/{id}` | AdminOnly | Update name/role. | Users |
| `PUT /api/users/{id}/activate` / `deactivate` | AdminOnly | Toggle `IsActive` (domain methods exist). | Users |
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
| `POST /api/auth/login` does not verify passwords (Phase 4 placeholder). | Login form still requires a password; any value works. Demo accounts are listed on the login page. |
| Enums serialize as integers. | Types use numeric enums; `status` query param is sent as the number (backend `Enum.Parse` accepts it). Consider `JsonStringEnumConverter` for readability. |
| No seed data / registration. | `dev/seed.sql` inserts the demo tenant + users for live mode. |

## Resolved

- `GET /api/users/me` — profile of the signed-in user (`User` + `tenantName`), any role.
- `GET /api/service-requests/{id}/logs` — `ServiceLog[]` ordered by `createdAt`, tenant- and Customer-scoped.
- `GET /api/service-requests?customerId=` — plus implicit Customer scoping on the list and `GET /{id}`; "My requests" no longer filters client-side.
- `AssignWorker` writes a Pending→Assigned `ServiceLog`.
- CORS allows `http://localhost:5173`; the Vite proxy is kept for convenience.
- `GET /api/service-requests?search=&sort=` — `search`: trimmed, case-insensitive substring on title OR description, applied before `totalCount`, max 200 (`SR_006_SEARCH_TOO_LONG`); `sort`: `createdAt|title|status[:asc|desc]`, default `createdAt:desc`, tie-break `id`, invalid → `SR_007_SORT_INVALID` (`status` orders by enum name). The requests list now searches/sorts server-side.
- `GET /api/users/{id}` — any role, tenant-scoped; missing or other tenant → 404 `RES_001_NOT_FOUND`.
- `GET /api/workers/profiles` — WorkerOrAdmin; plain `WorkerProfile[]` for the tenant, ordered by `createdAt`.
- `GET /api/workers/{userId}/profile` — any role; 404 `RES_001_NOT_FOUND` when the user has no profile in the caller's tenant.
- `PUT /api/workers/{userId}/profile` — WorkerOrAdmin (a Worker only for themselves, otherwise 404); full replacement `{ specialization, phoneNumber, isAvailable }`, trimmed, empty → `null`; upserts and always returns 200; target must be a Worker (else 404); `WRK_001_SPECIALIZATION_TOO_LONG` (> 200), `WRK_002_PHONE_TOO_LONG` (> 20).
