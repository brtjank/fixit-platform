namespace FixIt.Domain.Exceptions;

public class ResourceNotFoundException : NotFoundException
{
    public string EntityName { get; }
    public string Identifier { get; }

    public ResourceNotFoundException(string entityName, string identifier)
        : base(
            errorCode: "RES_001_NOT_FOUND",
            message: $"{entityName} with identifier '{identifier}' was not found."
        )
    {
        EntityName = entityName;
        Identifier = identifier;
    }
}
