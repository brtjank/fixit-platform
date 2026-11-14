using System.Globalization;
using System.Security.Claims;
using FixIt.Application.Common;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;

namespace FixIt.Application.Features.Auth.SessionValidation;

public class UserSessionValidator : IUserSessionValidator
{
    private readonly IUserRepository _userRepository;

    public UserSessionValidator(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<bool> IsValidAsync(
        ClaimsPrincipal principal,
        CancellationToken cancellationToken = default
    )
    {
        var userIdValue =
            principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? principal.FindFirst(JwtClaimNames.Subject)?.Value;
        if (!Guid.TryParse(userIdValue, out var userId))
            return false;

        if (!Guid.TryParse(principal.FindFirst(JwtClaimNames.TenantId)?.Value, out var tenantId))
            return false;

        // Tokens issued before token versioning existed carry no "tv" claim; fail closed
        if (
            !int.TryParse(
                principal.FindFirst(JwtClaimNames.TokenVersion)?.Value,
                NumberStyles.None,
                CultureInfo.InvariantCulture,
                out var tokenVersion
            )
        )
            return false;

        var state = await _userRepository.GetSessionStateAsync(userId, cancellationToken);

        return state is not null
            && !state.IsDeleted
            && state.IsActive
            && state.TenantId == tenantId
            && state.TokenVersion == tokenVersion;
    }
}
