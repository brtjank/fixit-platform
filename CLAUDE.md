# FixIt Platform — Claude Code Context

## Co to za projekt
Backend API dla firm usługowych (zarządzanie zleceniami, pracownikami, klientami). Stack: .NET 8, Clean Architecture, PostgreSQL, Docker, JWT, Azure. Multi-tenant (shared DB, TenantId per encja).

Szczegółowy plan faz i domena: `PROJECT_BRIEF.md`  
Zasady kodowania, architektura, konwencje: `DEV_GUIDELINES.md`

## Status

| Faza | Status |
|------|--------|
| 0 — Setup | ✅ |
| 1 — Domain & Application | ✅ |
| 2 — EF Core, Persistence | ✅ |
| 3 — Auth & Security (JWT) | ✅ |
| 4 — API Layer | ✅ |
| 5 — Async Messaging | ✅ |
| **6 — Docker** | **⏳ NEXT** |
| 7 — CI/CD (GitHub Actions) | ⏳ |
| 8 — Azure Deployment | ⏳ |
| 9 — Monitoring & README | ⏳ |

Testy: 269/269 pass (Application + Domain unit tests).

## Architektura — kluczowe decyzje

- **API używa Application DTOs bezpośrednio** — bez duplikacji w Api.Contracts
- **ICurrentUserService** wyciąga TenantId/UserId/Role z JWT claims; rzuca wyjątek zamiast zwracać Guid.Empty (fail fast)
- **Ownership checks w use case handlers** — `resource.TenantId != _currentUser.TenantId` → `ResourceNotFoundException` (nie ujawnia istnienia zasobów innych tenantów)
- **Global Query Filters tylko dla soft delete** — filtrowanie po TenantId w repozytoriach (jest dynamiczne per request)
- **Repozytoria zwracają IQueryable<T>** dla query z filtrowaniem/paginacją; `IQueryableExecutor` w Application layer (brak zależności od EF Core)
- **Exception hierarchy:** `AppException` → kategorie semantyczne (`BadRequestException`, `NotFoundException`, `UnauthorizedException`, `ForbiddenException`) → konkretne wyjątki z `ErrorCode` (format: `PREFIX_NNN_DESCRIPTION`)
- **ErrorHandlingMiddleware** mapuje kategorie na HTTP codes, zwraca ErrorCode + RequestId
- **Fluent API** w Infrastructure, nie Data Annotations w Domain
- **SoftDelete()** automatycznie ustawia `IsActive = false`

## Phase 5 — Async Messaging (zrobione)

Transactional outbox → Azure Storage Queue (lokalnie Azurite) → osobny proces `FixIt.Worker` → in-app notyfikacje. Szczegóły i diagram: `DEV_GUIDELINES.md` → „Messaging”.
- `ServiceRequest.ChangeStatus/AssignWorker` podnoszą `ServiceRequestStatusChanged` (tylko gdy status faktycznie się zmienia); `FixItDbContext.SaveChangesAsync` zapisuje eventy do `OutboxMessages` w tej samej transakcji
- `OutboxPublisher` (hosted w API) wysyła do kolejki `service-request-events` (`FOR UPDATE SKIP LOCKED`); `QueueConsumer` (Worker) → `HandleServiceRequestStatusChangedCommand` → `Notifications` (idempotentnie po `SourceEventId + RecipientUserId`); poison: `service-request-events-poison`
- `ServiceLog` nadal zapisywany synchronicznie w handlerach
- API: `GET /api/notifications`, `GET /api/notifications/unread-count`, `PUT /api/notifications/{id}/read`, `PUT /api/notifications/read-all`

Sekrety przez env vars / Azure Key Vault (Phase 8), np. `Messaging__QueueConnectionString`.

## Frontend (`web/`)

React 19 + Vite + TypeScript + Tailwind v4, TanStack Query, MSW. Feature-sliced; docs w `web/ARCHITECTURE.md`, `web/README.md`.
- `VITE_API_MODE=mock` (domyślnie, bez backendu) / `live` (proxy `/api` → `localhost:5177`; backend nie ma CORS)
- Endpointy, których backend nie ma, są mockowane i opisane w `web/docs/API_GAPS.md` (to lista kandydatów na zmiany w backendzie)
- Dwa języki (EN/PL), tłumaczenia w `web/src/locales/<lang>/<namespace>.json`
- `cd web && npm run dev` · `npm run typecheck` · `npm run lint` · `npm run build`

## Dev setup

```bash
docker-compose up -d          # PostgreSQL 16 na porcie 5433 + Azurite (kolejki) na 10001
./scripts/migrate-database.sh # EF Core migrations
dotnet run --project src/FixIt.Api     # API + OutboxPublisher
dotnet run --project src/FixIt.Worker  # QueueConsumer (notyfikacje)
```

Testy: `dotnet test src/FixIt.sln`
