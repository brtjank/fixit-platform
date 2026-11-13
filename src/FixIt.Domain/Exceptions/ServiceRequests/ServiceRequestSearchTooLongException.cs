namespace FixIt.Domain.Exceptions;

public class ServiceRequestSearchTooLongException : BadRequestException
{
    public int MaxLength { get; }

    public ServiceRequestSearchTooLongException(int maxLength)
        : base(
            errorCode: "SR_006_SEARCH_TOO_LONG",
            message: $"Search term cannot be longer than {maxLength} characters."
        )
    {
        MaxLength = maxLength;
    }
}
