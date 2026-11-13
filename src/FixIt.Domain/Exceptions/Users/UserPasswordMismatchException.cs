namespace FixIt.Domain.Exceptions;

public class UserPasswordMismatchException : BadRequestException
{
    public UserPasswordMismatchException()
        : base(errorCode: "USR_008_PASSWORD_MISMATCH", message: "Current password is incorrect.") { }
}
