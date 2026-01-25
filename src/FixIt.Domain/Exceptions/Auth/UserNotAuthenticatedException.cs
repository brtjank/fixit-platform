namespace FixIt.Domain.Exceptions;

public class UserNotAuthenticatedException : UnauthorizedException
{
    public UserNotAuthenticatedException()
        : base(errorCode: "AUTH_001_NOT_AUTHENTICATED", message: "User is not authenticated.") { }
}
