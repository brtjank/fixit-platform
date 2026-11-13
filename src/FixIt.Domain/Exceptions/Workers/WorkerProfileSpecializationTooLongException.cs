namespace FixIt.Domain.Exceptions;

public class WorkerProfileSpecializationTooLongException : BadRequestException
{
    public int MaxLength { get; }

    public WorkerProfileSpecializationTooLongException(int maxLength)
        : base(
            errorCode: "WRK_001_SPECIALIZATION_TOO_LONG",
            message: $"Worker specialization cannot be longer than {maxLength} characters."
        )
    {
        MaxLength = maxLength;
    }
}
