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
- **JWT Authentication** - Token-based authentication with role-based authorization
- **GitHub Actions** - CI/CD
- **Azure Services**:
  - Azure Container Apps or App Service
  - GitHub Container Registry (GHCR)
  - Azure Storage Queue (local: Azurite) - Async messaging
  - Azure Key Vault (secrets management)
  - Azure Application Insights (monitoring)

## 📁 Project Structure

```
fixit-platform/
├── src/          # Source code (Domain, Application, Infrastructure, API)
├── infra/        # Infrastructure as Code (Bicep/Terraform)
├── docs/         # Documentation
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

All entities include:
- `Id` - Unique identifier
- `TenantId` - Tenant isolation
- `CreatedAt` - Audit timestamp
- `SoftDelete` - Soft delete support

### User Roles

- **Admin** (Service Company) - Manages users, assigns requests, full access
- **Worker** - Views assigned requests, updates status, adds notes
- **Customer** - Submits service requests, views status of their requests

## 🚀 Getting Started

> **Note:** The project is currently in early development. Full setup instructions will be available later.

### Prerequisites

- .NET 8 SDK
- Docker
- Azure CLI (for cloud deployment)

## 📝 License

This project is licensed under the **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)** license.

See [LICENSE](LICENSE) file for details.

## 📊 Project Status

**Current Status:** 🚧 In Development - Phase 0 (Foundation) ✅ COMPLETED

- ✅ Repository structure
- ✅ Project configuration files
- ✅ Phase 0: Setup project (solution, projects, DI, logging)
- ⏳ Phase 1: Domain & Application (entities, use cases, validation)
- ⏳ Phase 2: Persistence & EF Core (multi-tenant data layer)
- ⏳ Phase 3: Auth & Security (JWT, roles, tenant isolation)
- ⏳ Phase 4: API Layer (REST endpoints, DTOs, Swagger)
- ⏳ Phase 5: Async Messaging (Azure Storage Queue (local: Azurite))
- ⏳ Phase 6: Docker (containerization)
- ⏳ Phase 7: CI/CD (GitHub Actions)
- ⏳ Phase 8: Azure Deployment (cloud infrastructure)
- ⏳ Phase 9: Monitoring & Documentation

## 🤝 Contributing

This is a portfolio project. Feedback is welcome, but please note this is primarily a showcase project.

## 📚 Documentation

Coming in later development stages.

---

**Disclaimer:** This project is for educational and portfolio purposes only. It is not intended for production use.
