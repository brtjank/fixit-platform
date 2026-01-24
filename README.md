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
- **Entity Framework Core** - ORM for data access (planned in Phase 2)
- **PostgreSQL** - Database (local via Docker and cloud via Azure Flexible Server)
- **Docker** - Containerization
- **JWT Authentication** - Token-based authentication with role-based authorization
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
- Global Query Filters in EF Core for automatic tenant filtering
- JWT claims include `TenantId` for authorization
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

The project uses custom domain exceptions (all inherit from `AppException`) for semantic error handling.

## 🧪 Testing

- `FixIt.Application.Tests` - 19 tests covering use cases (AssignWorker, ChangeServiceStatus, and others)
- `FixIt.Domain.Tests` - 32 tests covering domain entities, validation, and soft delete logic
- **Total:** 51 tests, all passing ✅
- **Coverage:** 100% for use cases and domain logic

Tests follow AAA pattern (Arrange-Act-Assert) and use semantic exception type checking rather than message validation.

## 🚀 Getting Started

> **Note:** The project is currently in Phase 1 (Domain & Application) completed. Full setup instructions will be available in later phases.

### Prerequisites

- .NET 8 SDK
- Docker (for local PostgreSQL - planned in Phase 2)
- Azure CLI (for cloud deployment - planned in Phase 8)

## 📝 License

This project is licensed under the **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)** license.

See [LICENSE](LICENSE) file for details.

## 📊 Project Status

**Current Status:** 🚧 In Development - Phase 1 ✅ COMPLETED + Tests ✅ COMPLETED

- ✅ Phase 0: Setup Project
- ✅ Phase 1: Domain & Application
- ✅ Phase 1 Tests: Unit Tests (51 tests, 100% coverage for use cases and domain logic)
- ⏳ Phase 2: Persistence & EF Core - NEXT
- ⏳ Phase 3: Auth & Security
- ⏳ Phase 4: API Layer
- ⏳ Phase 5: Async Messaging
- ⏳ Phase 6: Docker
- ⏳ Phase 7: CI/CD
- ⏳ Phase 8: Azure Deployment
- ⏳ Phase 9: Monitoring & Documentation

## 🤝 Contributing

This is a portfolio project. Feedback is welcome, but please note this is primarily a showcase project.

---

**Disclaimer:** This project is for educational and portfolio purposes only. It is not intended for production use.
