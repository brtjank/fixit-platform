namespace FixIt.Domain.Exceptions;

/// <summary>
/// Base exception for all application exceptions.
/// All custom exceptions should inherit from this class.
/// </summary>
public abstract class AppException : Exception
{
    protected AppException(string message)
        : base(message) { }

    protected AppException(string message, Exception innerException)
        : base(message, innerException) { }
}
