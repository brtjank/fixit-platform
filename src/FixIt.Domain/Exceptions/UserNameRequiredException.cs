namespace FixIt.Domain.Exceptions;

public class UserNameRequiredException : BadRequestException
{
    public string FieldName { get; }

    public UserNameRequiredException(string fieldName)
        : base($"User {fieldName} is required and cannot be empty.")
    {
        FieldName = fieldName;
    }
}
