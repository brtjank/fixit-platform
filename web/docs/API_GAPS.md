# API gaps — endpoints the UI needs that the backend does not have yet

The frontend mocks these with MSW (in **both** API modes). Each is a proposal for a future backend
endpoint, shaped to fit the existing conventions (camelCase JSON, numeric enums, `Paged<T>` envelope,
`{ errorCode, message, requestId }` errors, policies).

| Endpoint | Policy | Purpose / proposed contract | Used by |
| --- | --- | --- | --- |
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
- `POST /api/auth/login` verifies passwords (PBKDF2 via `PasswordHasher<User>`); unknown / inactive / deleted / no hash / wrong password → the same 401 `AUTH_001_NOT_AUTHENTICATED`. Every demo account (seed.sql and MSW) uses `Demo123!` (`DEMO_PASSWORD`); the login page's demo buttons fill it in.
- `POST /api/users` — AdminOnly; `{ email, firstName, lastName, role, password }` → 201 `User` + `Location`; email trimmed, unique globally, case-insensitive (`USR_005_EMAIL_TAKEN`); password 8–128 (`USR_007_PASSWORD_TOO_WEAK`); `USR_001/002/004` domain rules; a Worker also gets an empty `WorkerProfile` (`isAvailable = true`).
- `PUT /api/users/{id}` — AdminOnly; full replacement `{ firstName, lastName, role }` → 200 `User`; other tenant → 404 `RES_001_NOT_FOUND`; own role change → `USR_009_SELF_ROLE_CHANGE`.
- `PUT /api/users/{id}/activate` / `deactivate` — AdminOnly, no body, idempotent → 200 `User`; other tenant → 404; deactivating yourself → `USR_006_SELF_DEACTIVATE`; activating a soft-deleted user → `USR_003_CANNOT_ACTIVATE`.
- `PUT /api/users/me/password` — any role; `{ currentPassword, newPassword }` → 204; wrong current → `USR_008_PASSWORD_MISMATCH`; weak new → `USR_007`.
- `PUT /api/users/{id}/password` — AdminOnly admin reset (no email flow); `{ newPassword }` → 204; other tenant → 404 `RES_001_NOT_FOUND`; weak → `USR_007`.
