namespace FixIt.Domain.Exceptions;

public class UserSelfRoleChangeException : BadRequestException
{
    public UserSelfRoleChangeException()
        : base(errorCode: "USR_009_SELF_ROLE_CHANGE", message: "You cannot change your own role.") { }
}
