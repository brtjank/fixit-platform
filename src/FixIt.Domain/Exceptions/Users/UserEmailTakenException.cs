namespace FixIt.Domain.Exceptions;

public class UserEmailTakenException : BadRequestException
{
    public string Email { get; }

    public UserEmailTakenException(string email)
        : base(
            errorCode: "USR_005_EMAIL_TAKEN",
            message: $"A user with email '{email}' already exists."
        )
    {
        Email = email;
    }
}
