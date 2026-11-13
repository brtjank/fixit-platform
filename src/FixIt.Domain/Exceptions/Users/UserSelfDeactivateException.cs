namespace FixIt.Domain.Exceptions;

public class UserSelfDeactivateException : BadRequestException
{
    public UserSelfDeactivateException()
        : base(
            errorCode: "USR_006_SELF_DEACTIVATE",
            message: "You cannot deactivate your own account."
        ) { }
}
