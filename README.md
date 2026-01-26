# FixIt.Platform

## 🎯 Project Purpose

**FixIt.Platform** is an open-source project intended as a technical showcase for portfolio purposes, demonstrating:
- Clean Architecture principles in .NET 8
- Docker containerization
- Azure cloud integration
- Async messaging (Queue)
- CI/CD
- Multi-tenancy - shared database with logical data isolation
- Production-like patterns and practices

## 🛠️ Technology Stack

- **.NET 8**
- **ASP.NET Core Web API** - RESTful API
- **Entity Framework Core** - ORM for data access
- **PostgreSQL** - Database (local via Docker and cloud via Azure Flexible Server)
- **Docker** - Containerization
- **JWT Authentication** - Token-based authentication with role-based authorization (JWT Bearer)
- **MediatR** - CQRS pattern implementation
- **FluentValidation** - Request validation
- **Serilog** - Structured logging
- **Testing:**
  - **xUnit** - Test framework
  - **Moq** - Mocking framework
  - **FluentAssertions** - Fluent assertions library
- **GitHub Actions** - CI/CD (planned)
- **Azure Services** (planned):
  - Azure Container Apps or App Service
  - GitHub Container Registry (GHCR)
  - Azure Storage Queue (local: Azurite) - Async messaging
  - Azure Key Vault (secrets management)
  - Azure Application Insights (monitoring)

## 📁 Project Structure

```
fixit-platform/
├── src/          # Source code (Domain, Application, Infrastructure, API)
│   ├── FixIt.Api/              # API layer (Controllers, Middleware)
│   ├── FixIt.Application/      # Application layer (CQRS, Use cases)
│   ├── FixIt.Domain/           # Domain layer (Entities, Exceptions, Enums)
│   └── FixIt.Infrastructure/   # Infrastructure layer (EF Core, Repositories)
├── tests/        # Test projects
│   ├── FixIt.Application.Tests/  # Unit tests for use cases
│   └── FixIt.Domain.Tests/       # Unit tests for domain entities
├── scripts/      # Utility scripts
├── infra/        # Infrastructure as Code (Bicep/Terraform) - planned
├── docs/         # Documentation - planned
```

## 🏗️ Architecture

The project follows **Clean Architecture** principles with clear separation of concerns:

- **Domain** - Core business entities, value objects, and domain rules (no dependencies)
- **Application** - Use cases, interfaces, DTOs (depends on Domain only)
- **Infrastructure** - EF Core, Service Bus, external integrations (depends on Application/Domain)
- **API** - Controllers, authentication, middleware (depends on Application)

### Multi-Tenancy

The system implements **multi-tenancy** using a shared database with logical data isolation:
- Shared database, shared schema
- `TenantId` in every entity
- Global Query Filters in EF Core for soft delete
- TenantId from JWT claims (automatic filtering)
- Ownership checks in use cases
- Each tenant = one service company

## 🧠 Domain Model

### Core Entities

- **Tenant** - Service company (multi-tenant isolation)
- **User** - System users (Admin, Worker, Customer roles)
- **WorkerProfile** - Worker-specific profile data
- **ServiceRequest** - Service request/order from customer
- **ServiceLog** - History log for service requests

All entities include:
- `Id` - Unique identifier (Guid)
- `TenantId` - Tenant isolation (required for multi-tenancy)
- `CreatedAt` - Audit timestamp (UTC)
- `IsDeleted` - Soft delete flag
- `IsActive` - Active status (for Users and Tenants)

### User Roles

- **Admin** (Service Company) - Manages users, assigns requests, full access
- **Worker** - Views assigned requests, updates status, adds notes
- **Customer** - Submits service requests, views status of their requests

### Domain Exceptions

The project uses custom domain exceptions (all inherit from `AppException`) for semantic error handling. Each exception has a stable `ErrorCode` (e.g., "SR_001_STATUS_IMMUTABLE") used in API responses and error handling middleware.

## 💼 Example Business Scenarios

### Customer Submits Service Request
Customer logs in and creates service request via `POST /api/service-requests`. System validates ownership and creates request with `Pending` status. Customer views their requests via `GET /api/service-requests`.

### Admin Assigns Worker
Admin views service requests and available workers, then assigns worker via `PUT /api/service-requests/{id}/assign-worker`. System validates tenant ownership, request status (`Pending`), and worker role. Status automatically changes to `Assigned`.

### Worker Updates Status
Worker views assigned requests via `GET /api/service-requests?assignedWorkerId={id}` and updates status via `PUT /api/service-requests/{id}/change-status`. System validates tenant ownership and status transition rules. Status progresses: `InProgress` → `Completed`.

## 🧪 Testing

- `FixIt.Application.Tests` - 18 tests covering use cases (AssignWorker, ChangeServiceStatus, and others)
- `FixIt.Domain.Tests` - 32 tests covering domain entities, validation, and soft delete logic
- **Total:** 50 tests, all passing ✅
- **Coverage:** 100% for use cases and domain logic

Tests follow AAA pattern (Arrange-Act-Assert) and use semantic exception type checking rather than message validation.

## 🚀 Getting Started

### Prerequisites

- .NET 8 SDK
- Docker and Docker Compose (for local PostgreSQL)
- Azure CLI (for cloud deployment - planned in Phase 8)

### Local Development Setup

1. **Start PostgreSQL database:**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations:**
   
   Use the provided script:
   ```bash
   ./scripts/migrate-database.sh
   ```

3. **Run the application:**
   ```bash
   cd src/FixIt.Api
   dotnet run
   ```

The API will be available at `https://localhost:5001` (or the port configured in `launchSettings.json`).

### Database Connection

The default connection string is defined in `appsettings.json` configuration file.

## 📝 License

This project is licensed under the **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)** license.

See [LICENSE](LICENSE) file for details.

## 📊 Project Status

**Current Status:** 🚧 In Development - Phase 4 ✅ COMPLETED

- ✅ Phase 0: Setup Project
- ✅ Phase 1: Domain & Application
- ✅ Phase 1 Tests: Unit Tests (50 tests, 100% coverage for use cases and domain logic)
- ✅ Phase 2: Persistence & EF Core
- ✅ Phase 3: Auth & Security
- ✅ Phase 4: API Layer
- ⏳ Phase 5: Async Messaging
- ⏳ Phase 6: Docker
- ⏳ Phase 7: CI/CD
- ⏳ Phase 8: Azure Deployment
- ⏳ Phase 9: Monitoring & Documentation

## 🤝 Contributing

This is a portfolio project. Feedback is welcome, but please note this is primarily a showcase project.

---

**Disclaimer:** This project is for educational and portfolio purposes only. It is not intended for production use.
