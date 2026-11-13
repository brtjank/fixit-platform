namespace FixIt.Domain.Exceptions;

public class UserPasswordTooWeakException : BadRequestException
{
    public UserPasswordTooWeakException(int minLength, int maxLength)
        : base(
            errorCode: "USR_007_PASSWORD_TOO_WEAK",
            message: $"Password must be between {minLength} and {maxLength} characters."
        ) { }
}
