namespace FixIt.Domain.Exceptions;

public class UserEmailRequiredException : BadRequestException
{
    public UserEmailRequiredException()
        : base(
            errorCode: "USR_001_EMAIL_REQUIRED",
            message: "User email is required and cannot be empty."
        ) { }
}
