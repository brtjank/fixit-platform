namespace FixIt.Domain.Exceptions;

public class WorkerProfilePhoneNumberTooLongException : BadRequestException
{
    public int MaxLength { get; }

    public WorkerProfilePhoneNumberTooLongException(int maxLength)
        : base(
            errorCode: "WRK_002_PHONE_TOO_LONG",
            message: $"Worker phone number cannot be longer than {maxLength} characters."
        )
    {
        MaxLength = maxLength;
    }
}
