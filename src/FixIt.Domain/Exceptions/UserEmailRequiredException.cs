namespace FixIt.Domain.Exceptions;

public class UserEmailRequiredException : BadRequestException
{
    public UserEmailRequiredException()
        : base("User email is required and cannot be empty.") { }
}
