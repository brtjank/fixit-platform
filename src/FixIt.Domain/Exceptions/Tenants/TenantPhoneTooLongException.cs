namespace FixIt.Domain.Exceptions;

public class TenantPhoneTooLongException : BadRequestException
{
    public int MaxLength { get; }

    public TenantPhoneTooLongException(int maxLength)
        : base(
            errorCode: "TEN_005_PHONE_TOO_LONG",
            message: $"Tenant phone cannot be longer than {maxLength} characters."
        )
    {
        MaxLength = maxLength;
    }
}
