namespace FixIt.Domain.Exceptions;

/// <summary>
/// Base class for all bad request exceptions (400).
/// Represents client errors - invalid input, validation failures, business rule violations.
/// </summary>
public abstract class BadRequestException : AppException
{
    protected BadRequestException(string errorCode, string message)
        : base(errorCode, message) { }

    protected BadRequestException(string errorCode, string message, Exception innerException)
        : base(errorCode, message, innerException) { }
}
