namespace FixIt.Domain.Exceptions;

public class TenantAddressTooLongException : BadRequestException
{
    public int MaxLength { get; }

    public TenantAddressTooLongException(int maxLength)
        : base(
            errorCode: "TEN_006_ADDRESS_TOO_LONG",
            message: $"Tenant address cannot be longer than {maxLength} characters."
        )
    {
        MaxLength = maxLength;
    }
}
