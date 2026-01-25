namespace FixIt.Domain.Exceptions;

/// <summary>
/// Base class for all unauthorized exceptions (401).
/// Represents authentication failures - user is not authenticated or authentication is invalid.
/// </summary>
public abstract class UnauthorizedException : AppException
{
    protected UnauthorizedException(string errorCode, string message)
        : base(errorCode, message) { }

    protected UnauthorizedException(string errorCode, string message, Exception innerException)
        : base(errorCode, message, innerException) { }
}
