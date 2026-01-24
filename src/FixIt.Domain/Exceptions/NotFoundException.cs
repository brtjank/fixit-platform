namespace FixIt.Domain.Exceptions;

public class NotFoundException : AppException
{
    public NotFoundException(string entityName, string identifier)
        : base($"{entityName} with identifier '{identifier}' was not found.") { }

    public NotFoundException(string entityName, string identifier, Exception innerException)
        : base($"{entityName} with identifier '{identifier}' was not found.", innerException) { }
}
