using FixIt.Domain.Enums;

namespace FixIt.Domain.Exceptions;

public class UserRoleInvalidException : BadRequestException
{
    public Guid? UserId { get; }
    public UserRole? ExpectedRole { get; }
    public UserRole ActualRole { get; }

    public UserRoleInvalidException(Guid userId, UserRole expectedRole, UserRole actualRole)
        : base(
            errorCode: "USR_004_ROLE_INVALID",
            message: $"User with id {userId} has role {actualRole}, but {expectedRole} is required."
        )
    {
        UserId = userId;
        ExpectedRole = expectedRole;
        ActualRole = actualRole;
    }

    // Used when a request supplies a role value outside the UserRole enum (e.g. a numeric 7)
    public UserRoleInvalidException(UserRole actualRole)
        : base(
            errorCode: "USR_004_ROLE_INVALID",
            message: $"Role '{actualRole}' is not a valid user role."
        )
    {
        ActualRole = actualRole;
    }
}
