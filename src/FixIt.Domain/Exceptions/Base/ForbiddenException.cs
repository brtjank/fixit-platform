namespace FixIt.Domain.Exceptions;

/// <summary>
/// Base class for all forbidden exceptions (403).
/// Represents authorization failures - user is authenticated but lacks required permissions.
/// </summary>
public abstract class ForbiddenException : AppException
{
    protected ForbiddenException(string errorCode, string message)
        : base(errorCode, message) { }

    protected ForbiddenException(string errorCode, string message, Exception innerException)
        : base(errorCode, message, innerException) { }
}
