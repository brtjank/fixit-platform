using FixIt.Domain.Entities;

namespace FixIt.Application.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, Guid tenantId, CancellationToken cancellationToken = default);
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(
        string email,
        Guid tenantId,
        CancellationToken cancellationToken = default
    );
    Task<IEnumerable<User>> GetByTenantIdAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default
    );
    Task<IEnumerable<User>> GetWorkersByTenantIdAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default
    );
    Task<User> AddAsync(User user, CancellationToken cancellationToken = default);
    Task UpdateAsync(User user, CancellationToken cancellationToken = default);
}
