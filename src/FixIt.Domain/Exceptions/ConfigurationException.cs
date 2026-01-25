namespace FixIt.Domain.Exceptions;

public class ConfigurationException : AppException
{
    public ConfigurationException(string message)
        : base(message) { }

    public ConfigurationException(string message, Exception innerException)
        : base(message, innerException) { }
}
