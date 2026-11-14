namespace FixIt.Domain.Exceptions;

/// <summary>
/// The token is valid cryptographically but no longer matches the account: the user was
/// deactivated or deleted, or their password or role changed after the token was issued.
/// </summary>
public class SessionRevokedException : UnauthorizedException
{
    public SessionRevokedException()
        : base(
            errorCode: "AUTH_003_SESSION_REVOKED",
            message: "Your session has ended. Please sign in again."
        ) { }
}
