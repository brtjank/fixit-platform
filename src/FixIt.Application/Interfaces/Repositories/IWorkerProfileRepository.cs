using FixIt.Domain.Entities;

namespace FixIt.Application.Interfaces.Repositories;

public interface IWorkerProfileRepository
{
    Task<WorkerProfile?> GetByUserIdAsync(
        Guid userId,
        Guid tenantId,
        CancellationToken cancellationToken = default
    );
    IQueryable<WorkerProfile> GetByTenantId(Guid tenantId);
    Task<WorkerProfile> AddAsync(
        WorkerProfile workerProfile,
        CancellationToken cancellationToken = default
    );
    Task UpdateAsync(WorkerProfile workerProfile, CancellationToken cancellationToken = default);
}
