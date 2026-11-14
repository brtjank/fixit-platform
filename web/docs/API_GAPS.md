# API gaps — endpoints the UI needs that the backend does not have yet

**None at the moment** — every endpoint the UI calls exists on the backend, so MSW is only started in
`VITE_API_MODE=mock`. If the UI ever needs an endpoint ahead of the backend, list it here as a proposal
(camelCase JSON, numeric enums, `Paged<T>` envelope, `{ errorCode, message, requestId }` errors, policies),
mock it with MSW in both modes and mark the UI with `<MockBadge />`.

| Endpoint | Policy | Purpose / proposed contract | Used by |
| --- | --- | --- | --- |
| — | | | |

## Behavioural gaps in existing endpoints (worked around client-side)

| Gap | Workaround in the UI |
| --- | --- |
| Enums serialize as integers. | Types use numeric enums; `status` query param is sent as the number (backend `Enum.Parse` accepts it). Consider `JsonStringEnumConverter` for readability. |
| No self-service sign-up / tenant onboarding. | `dev/seed.sql` creates the demo tenant (incl. settings) and its users for live mode; further users are created by an admin (`POST /api/users`). |

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
- `PUT /api/users/me/password` — any role; `{ currentPassword, newPassword }` → 200 `{ token }` (new JWT; the old one and the user's other sessions are revoked); wrong current → `USR_008_PASSWORD_MISMATCH`; weak new → `USR_007`.
- `PUT /api/users/{id}/password` — AdminOnly admin reset (no email flow); `{ newPassword }` → 204; other tenant → 404 `RES_001_NOT_FOUND`; weak → `USR_007`.
- Definitions used by the dashboard/workload endpoints: **open** = Pending | Assigned | InProgress; a request's **completedAt** = `createdAt` of its latest `ServiceLog` with `newStatus` Completed (not the request's own `createdAt`); "last 30 days" = `(now-30d, now]`, "previous 30 days" = `(now-60d, now-30d]`; `pct(cur, prev) = prev == 0 ? (cur == 0 ? 0 : 100) : round((cur-prev)/prev*100, 1)`.
- `GET /api/workers/workload` — WorkerOrAdmin; `{ workerId, open, inProgress, completedLast30Days }[]`, one row per Worker (inactive included), ordered by worker `createdAt` then `id`; `open` = Assigned | InProgress, `completedLast30Days` by completedAt.
- `GET /api/dashboard/stats` — WorkerOrAdmin; `{ openRequests, pendingUnassigned, inProgress, completedLast30Days, avgResolutionHours, activeWorkers, availableWorkers, trends }`; avg = mean `completedAt - createdAt` in hours (1 decimal, 0 when none); a worker without a profile counts as available; `trends.openRequests` = requests **created** last 30 vs previous 30 days (the open backlog has no history — the UI labels it "new requests vs previous 30 days"); `trends.avgResolutionHours` = 0 when the previous window has no completions.
- `GET /api/dashboard/status-breakdown` — WorkerOrAdmin; exactly five `{ status, count }` rows (1..5), zero-filled.
- `GET /api/dashboard/volume?days=30` — WorkerOrAdmin; `days` clamped to [7, 90] (non-numeric → 30); exactly `days` UTC points `{ date, created, completed }`, oldest first, last = today; `completed` counts Completed `ServiceLog`s that day.
- `GET /api/dashboard/activity?limit=10` — WorkerOrAdmin; `limit` clamped to [1, 50] (non-numeric → 10); newest first, merged from `ServiceLog`s (`assigned` / `completed` / `cancelled` / `status_changed`; `detail` = notes or `"Pending → Assigned"` with enum names; actor `"System"` when unknown) and request creations (`id` = `created:<requestId>`, actor = customer, `detail` null).
- `GET /api/tenants/current` — any role; Tenant + `contactEmail`, `phone`, `address` (nullable), `timezone` (IANA), `plan` (`starter|team|business`, read-only). `PUT` — AdminOnly; full replacement `{ name, description, contactEmail, phone, address, timezone }`, trimmed, empty → `null`; `TEN_001_NAME_REQUIRED`, `TEN_003_NAME_TOO_LONG` (> 200), `TEN_004_CONTACT_EMAIL_INVALID` (one `@`, text on both sides, dot in the domain, ≤ 256), `TEN_005_PHONE_TOO_LONG` (> 30), `TEN_006_ADDRESS_TOO_LONG` (> 300), `TEN_007_TIMEZONE_INVALID`, `TEN_008_DESCRIPTION_TOO_LONG` (> 1000). The organization form shows these on the field.
- In-app notifications (Phase 5: `ServiceRequestStatusChanged` domain event → transactional outbox → Azure Storage Queue → `FixIt.Worker`
  consumer). Any role, always the caller's own (tenant + recipient scoped; a foreign id → 404 `RES_001_NOT_FOUND`).
  Recipients per event: the request's customer, its assigned worker and all active Admins of the tenant — distinct, minus the actor.
  Raised by `ChangeStatus` (only on a real change) and `AssignWorker` (Pending → Assigned); creating a request notifies nobody.
  `NotificationDto` = `{ id, type: "ServiceRequestStatusChanged", serviceRequestId, serviceRequestTitle, previousStatus, newStatus,
  actorName ("First Last" | null), createdAt, readAt }` — no stored text; the UI renders translated copy from type + statuses.
  - `GET /api/notifications?unreadOnly=false&limit=20` (limit 1..100) → `NotificationDto[]` newest first.
  - `GET /api/notifications/unread-count` → `{ count }` — the top-bar badge polls it every 30 s and on window focus.
  - `PUT /api/notifications/{id}/read` → `NotificationDto` (idempotent); `PUT /api/notifications/read-all` → `{ updated }`.
  Delivery is asynchronous, so a notification appears a few seconds after the change (next poll).
- `GET/PUT /api/users/me/notification-preferences` — any role, the caller's own; defaults `{ emailOnNewRequest: true, emailOnAssignment: true, emailOnStatusChange: true, dailyDigest: false }` until saved; PUT = full replacement of all four bools (upsert). **Stored only — no e-mail is sent yet**; the settings UI says so.
