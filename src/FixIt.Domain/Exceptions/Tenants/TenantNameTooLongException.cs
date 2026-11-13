namespace FixIt.Domain.Exceptions;

public class TenantNameTooLongException : BadRequestException
{
    public int MaxLength { get; }

    public TenantNameTooLongException(int maxLength)
        : base(
            errorCode: "TEN_003_NAME_TOO_LONG",
            message: $"Tenant name cannot be longer than {maxLength} characters."
        )
    {
        MaxLength = maxLength;
    }
}
