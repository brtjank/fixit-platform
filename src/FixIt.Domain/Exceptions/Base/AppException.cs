namespace FixIt.Domain.Exceptions;

/// <summary>
/// Base exception for all application exceptions.
/// All custom exceptions should inherit from this class.
/// </summary>
public abstract class AppException : Exception
{
    public string ErrorCode { get; }

    protected AppException(string errorCode, string message)
        : base(message)
    {
        ErrorCode = errorCode;
    }

    protected AppException(string errorCode, string message, Exception innerException)
        : base(message, innerException)
    {
        ErrorCode = errorCode;
    }
}
