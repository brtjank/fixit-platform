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
| **5 — Async Messaging** | **⏳ NEXT** |
| 6 — Docker | ⏳ |
| 7 — CI/CD (GitHub Actions) | ⏳ |
| 8 — Azure Deployment | ⏳ |
| 9 — Monitoring & README | ⏳ |

Testy: 50/50 pass (Application + Domain unit tests).

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

## Phase 5 — Async Messaging (co dalej)

Cel: event-driven element w systemie.

1. Zdefiniuj event domenowy: `ServiceRequestStatusChanged`
2. Publish event po zmianie statusu (`ChangeServiceStatusCommandHandler`)
3. Consumer: zapis do `ServiceLog` (historia)
4. Infrastruktura: Azure Storage Queue (lokalnie Azurite)

Sekrety przez env vars / Azure Key Vault (Phase 8).

## Dev setup

```bash
docker-compose up -d          # PostgreSQL 16 na porcie 5433
./scripts/migrate-database.sh # EF Core migrations
dotnet run --project src/FixIt.Api
```

Testy: `dotnet test`
