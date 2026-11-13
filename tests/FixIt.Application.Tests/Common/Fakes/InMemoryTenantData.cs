using FixIt.Application.Interfaces.Repositories;
using FixIt.Domain.Entities;
using Moq;

namespace FixIt.Application.Tests.Common.Fakes;

/// <summary>
/// In-memory rows behind repository mocks that behave like the real ones: scoped by tenant and
/// hiding soft-deleted rows. Rows can be added after the handler is constructed because the
/// mocks read the lists on every call.
/// </summary>
public class InMemoryTenantData
{
    public List<User> Users { get; } = [];
    public List<ServiceRequest> Requests { get; } = [];
    public List<ServiceLog> Logs { get; } = [];
    public List<WorkerProfile> Profiles { get; } = [];

    public Mock<IUserRepository> UserRepository { get; } = new();
    public Mock<IServiceRequestRepository> ServiceRequestRepository { get; } = new();
    public Mock<IServiceLogRepository> ServiceLogRepository { get; } = new();
    public Mock<IWorkerProfileRepository> WorkerProfileRepository { get; } = new();

    public InMemoryTenantData()
    {
        UserRepository
            .Setup(x => x.GetByTenantId(It.IsAny<Guid>()))
            .Returns((Guid tenantId) => Scoped(Users, tenantId));
        ServiceRequestRepository
            .Setup(x => x.GetByTenantId(It.IsAny<Guid>()))
            .Returns((Guid tenantId) => Scoped(Requests, tenantId));
        ServiceLogRepository
            .Setup(x => x.GetByTenantId(It.IsAny<Guid>()))
            .Returns((Guid tenantId) => Scoped(Logs, tenantId));
        WorkerProfileRepository
            .Setup(x => x.GetByTenantId(It.IsAny<Guid>()))
            .Returns((Guid tenantId) => Scoped(Profiles, tenantId));
    }

    private static IQueryable<T> Scoped<T>(List<T> rows, Guid tenantId)
        where T : BaseEntity => rows.Where(r => r.TenantId == tenantId && !r.IsDeleted).AsQueryable();
}
