namespace FixIt.Domain.Exceptions;

/// <summary>
/// Base class for all conflict exceptions (409).
/// Represents requests that clash with the current state of a resource, e.g. a concurrent create.
/// </summary>
public abstract class ConflictException : AppException
{
    protected ConflictException(string errorCode, string message)
        : base(errorCode, message) { }

    protected ConflictException(string errorCode, string message, Exception innerException)
        : base(errorCode, message, innerException) { }
}
