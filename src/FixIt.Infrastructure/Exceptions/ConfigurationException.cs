using FixIt.Domain.Exceptions;

namespace FixIt.Infrastructure.Exceptions;

public class ConfigurationException : AppException
{
    public ConfigurationException(string message)
        : base(errorCode: "INF_001_CONFIGURATION_ERROR", message: message) { }

    public ConfigurationException(string message, Exception innerException)
        : base(errorCode: "INF_001_CONFIGURATION_ERROR", message: message, innerException) { }
}
