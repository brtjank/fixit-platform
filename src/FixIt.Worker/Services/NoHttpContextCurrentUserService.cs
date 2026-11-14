using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Exceptions;

namespace FixIt.Worker.Services;

/// <summary>
/// The worker has no signed-in user. Message handlers get the tenant from the message itself;
/// anything that still asks for the current user fails fast instead of acting for a wrong tenant.
/// </summary>
public class NoHttpContextCurrentUserService : ICurrentUserService
{
    public Guid UserId => throw new UserNotAuthenticatedException();
    public Guid TenantId => throw new UserNotAuthenticatedException();
    public string Role => string.Empty;
    public bool IsAuthenticated => false;
}
