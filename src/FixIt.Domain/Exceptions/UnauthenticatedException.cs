namespace FixIt.Domain.Exceptions;

public class UnauthenticatedException : AppException
{
    public UnauthenticatedException(string message)
        : base(message) { }

    public UnauthenticatedException(string message, Exception innerException)
        : base(message, innerException) { }
}
