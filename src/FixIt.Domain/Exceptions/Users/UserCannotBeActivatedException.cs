namespace FixIt.Domain.Exceptions;

public class UserCannotBeActivatedException : BadRequestException
{
    public Guid UserId { get; }

    public UserCannotBeActivatedException(Guid userId)
        : base(
            errorCode: "USR_003_CANNOT_ACTIVATE",
            message: $"Cannot activate user {userId}. User is deleted."
        )
    {
        UserId = userId;
    }
}
