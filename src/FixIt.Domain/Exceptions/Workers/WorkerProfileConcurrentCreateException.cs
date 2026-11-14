namespace FixIt.Domain.Exceptions;

public class WorkerProfileConcurrentCreateException : ConflictException
{
    public Guid UserId { get; }

    public WorkerProfileConcurrentCreateException(Guid userId)
        : base(
            errorCode: "WRK_003_PROFILE_CONCURRENT_CREATE",
            message: "The profile was created by another request at the same time. Reload and try again."
        )
    {
        UserId = userId;
    }
}
