using System.Security.Claims;

namespace FixIt.Application.Interfaces.Services;

/// <summary>
/// Checks on every authenticated request that the token still matches the account
/// (exists, active, same tenant, same token version). No caching: revocation must be immediate.
/// </summary>
public interface IUserSessionValidator
{
    Task<bool> IsValidAsync(ClaimsPrincipal principal, CancellationToken cancellationToken = default);
}
