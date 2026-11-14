namespace FixIt.Domain.Exceptions;

public class TenantDescriptionTooLongException : BadRequestException
{
    public int MaxLength { get; }

    public TenantDescriptionTooLongException(int maxLength)
        : base(
            errorCode: "TEN_008_DESCRIPTION_TOO_LONG",
            message: $"Tenant description cannot be longer than {maxLength} characters."
        )
    {
        MaxLength = maxLength;
    }
}
