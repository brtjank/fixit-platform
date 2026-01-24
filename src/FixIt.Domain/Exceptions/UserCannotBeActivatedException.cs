namespace FixIt.Domain.Exceptions;

public class UserCannotBeActivatedException : BadRequestException
{
    public Guid UserId { get; }

    public UserCannotBeActivatedException(Guid userId)
        : base($"Cannot activate user {userId}. User is deleted.")
    {
        UserId = userId;
    }
}
