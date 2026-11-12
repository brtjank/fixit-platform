using FixIt.Domain.Entities;

namespace FixIt.Application.Interfaces.Repositories;

public interface ITenantRepository
{
    Task<Tenant?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
