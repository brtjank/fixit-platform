using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;

namespace FixIt.Application.Features.Users;

internal static class UserRoleGuard
{
    // JSON binding accepts any integer for an enum, so out-of-range values must be rejected explicitly
    public static void EnsureDefined(UserRole role)
    {
        if (!Enum.IsDefined(role))
            throw new UserRoleInvalidException(role);
    }
}
