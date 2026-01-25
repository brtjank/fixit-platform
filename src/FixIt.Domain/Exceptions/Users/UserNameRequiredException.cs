namespace FixIt.Domain.Exceptions;

public class UserNameRequiredException : BadRequestException
{
    public string FieldName { get; }

    public UserNameRequiredException(string fieldName)
        : base(
            errorCode: "USR_002_NAME_REQUIRED",
            message: $"User {fieldName} is required and cannot be empty."
        )
    {
        FieldName = fieldName;
    }
}
