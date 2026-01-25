namespace FixIt.Domain.Exceptions;

/// <summary>
/// Base class for all not found exceptions (404).
/// Represents resources that do not exist or are not accessible.
/// </summary>
public abstract class NotFoundException : AppException
{
    protected NotFoundException(string errorCode, string message)
        : base(errorCode, message) { }

    protected NotFoundException(string errorCode, string message, Exception innerException)
        : base(errorCode, message, innerException) { }
}
