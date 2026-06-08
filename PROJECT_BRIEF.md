📌 FIXIT – PROJECT BRIEF

🎯 1. Nadrzędny cel projektu

FixIt to backend API dla firm usługowych (naprawy, sprzątanie, serwis, itp.), umożliwiające:
- zarządzanie zleceniami klientów
- przypisywanie zleceń do pracowników
- śledzenie statusów, historii i kosztów
- obsługę wielu firm (multi-tenancy)

Projekt to produkcyjny backend z cloud-ready architecture:
- Docker + CI/CD + Azure
- multi-tenancy (SaaS-like)
- async messaging
- role-based access control


🧠 2. Koncepcja domenowa (co to za system)

FixIt to backend API dla firm usługowych (naprawy, sprzątanie, serwis), które:
- obsługują zlecenia klientów
- przypisują je do pracowników
- śledzą status, historię i koszty

System jest multi-tenant:
- każdy tenant = jedna firma usługowa
- dane tenantów są logicznie izolowane


🧑‍🤝‍🧑 3. Role użytkowników

Admin (firma usługowa)
- zarządza użytkownikami
- przypisuje zlecenia
- ma pełny wgląd

Worker (pracownik)
- widzi przypisane zlecenia
- aktualizuje status
- dodaje notatki

Customer (klient)
- zgłasza zlecenia
- widzi status swoich zgłoszeń


🧱 4. Architektura techniczna
Backend
- .NET 8 Web API
- Clean Architecture:
    - Api
    - Application
    - Domain
    - Infrastructure

Data
- PostgreSQL / Azure SQL
- EF Core
- Shared DB, shared schema
- TenantId w każdej encji

Auth
- JWT
- Role-based authorization
- TenantId jako claim

Infra
- Docker (multi-stage)
- CI/CD (GitHub Actions)
- Azure:
    - App Service lub Container Apps
    - Azure SQL / PostgreSQL
    - Key Vault
    - Application Insights
    - zure Storage Queue (local: Azurite) (topics)


🗂️ 5. MODELE DOMENOWE (CORE)
- Tenant
- User
- WorkerProfile
- ServiceRequest
- ServiceLog

Każda encja zawiera:
- Id
- TenantId
- CreatedAt
- SoftDelete


🪜 PLAN REALIZACJI – KROK PO KROKU

🔹 FAZA 0 – Setup projektu (fundament)
Cel: mieć czysty, stabilny szkielet
1. Utwórz repozytorium Git (publiczne)
2. Utwórz solution .NET 8
3. Utwórz projekty:
- FixIt.Api
- FixIt.Application
- FixIt.Domain
- FixIt.Infrastructure
4. Skonfiguruj podstawowe DI
5. Skonfiguruj logging
✔️ Efekt: aplikacja się uruchamia lokalnie

🔹 FAZA 1 – Domain & Application
Cel: czysta domena, bez infrastruktury
1. Zdefiniuj encje domenowe
2. Zdefiniuj enumy (statusy)
3. Dodaj podstawowe use cases:
- CreateServiceRequest
- AssignWorker
- ChangeServiceStatus
4. Dodaj walidację biznesową
✔️ Efekt: logika działa bez DB

🔹 FAZA 2 – Persistence & EF Core
Cel: trwałość danych + multi-tenant
1. Dodaj EF Core
2. Zaimplementuj DbContext
3. Dodaj TenantId do encji
4. Zaimplementuj Global Query Filters
5. Dodaj migracje
6. **Wydajność:** Repozytoria zwracają IQueryable<T> dla query z filtrowaniem/paginacją - wszystkie filtry wykonywane w bazie danych, nie w pamięci
✔️ Efekt: dane są izolowane per tenant, optymalne zapytania

🔹 FAZA 3 – Auth & Security
Cel: realne bezpieczeństwo
1. JWT authentication
2. Role-based authorization
3. TenantId jako claim
4. Ownership checks
✔️ Efekt: użytkownicy widzą tylko swoje dane

🔹 FAZA 4 – API Layer
Cel: REST API gotowe do użycia
1. Endpointy CRUD (tylko sensowne) oraz inne
2. DTOs
3. Pagination & filtering
4. Potrzebne middleware (ErrorHandlingMiddleware na pewno, pozostałe do zastanowienia)
5. Swagger / OpenAPI
6. Dodaj do README.md sekcję "Example Business Scenarios" - krótkie scenariusze pokazujące realne użycie systemu (multi-tenancy, workflow, role-based access).
✔️ Efekt: kompletne API

🔹 FAZA 5 – Async Messaging (Service Bus)
Cel: pokazać async communication
1. Zdefiniuj event: ServiceRequestStatusChanged
2. Publish event po zmianie statusu
3. Consumer:
- zapis do historii
- (opcjonalnie) notyfikacja
✔️ Efekt: event-driven element w systemie

🔹 FAZA 6 – Docker
Cel: cloud-ready app
1. Dockerfile (multi-stage)
2. docker-compose dla local dev
3. healthcheck
✔️ Efekt: aplikacja działa w kontenerze

🔹 FAZA 7 – CI/CD
Cel: automatyczny deploy
1. Pipeline:
- build
- test
- docker build
- deploy
2. Secrets przez env vars
✔️ Efekt: push = deploy

🔹 FAZA 8 – Azure Deployment
Cel: realny cloud experience
1. Utwórz:
- App Service / Container Apps
- DB
- Key Vault
- App Insights
- Service Bus
2. Skonfiguruj secrets
3. Podłącz CI/CD
✔️ Efekt: publiczny endpoint w Azure

🔹 FAZA 9 – Monitoring & README
Cel: sprzedaż projektu
1. App Insights (logs, metrics)
2. README:
- opis domeny
- architektura
- CI/CD
- Azure
- decyzje techniczne
- możliwe rozszerzenia
✔️ Efekt: projekt gotowy do wdrożenia i prezentacji

🧾 Kryteria sukcesu (DONE)
Projekt uznaje się za gotowy, jeśli:
- działa lokalnie i w Azure
- posiada CI/CD
- jest multi-tenant
- używa async messaging
- ma czytelne README