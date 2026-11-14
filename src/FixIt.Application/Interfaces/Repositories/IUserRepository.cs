using FixIt.Application.Features.Auth.SessionValidation;
using FixIt.Domain.Entities;

namespace FixIt.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, Guid tenantId, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    /// <summary>
    /// Global, case-insensitive check across all tenants, including soft-deleted users,
    /// because login resolves accounts by email alone.
    /// </summary>
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
    /// <summary>
    /// Lightweight, untracked lookup by id alone (any tenant, soft-deleted included) used to
    /// validate the session behind every authenticated request.
    /// </summary>
    Task<UserSessionState?> GetSessionStateAsync(
        Guid id,
        CancellationToken cancellationToken = default
    );
    IQueryable<User> GetByTenantId(Guid tenantId);
    Task<User> AddAsync(User user, CancellationToken cancellationToken = default);
    Task UpdateAsync(User user, CancellationToken cancellationToken = default);
}
