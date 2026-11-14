namespace FixIt.Domain.Exceptions;

public class TenantContactEmailInvalidException : BadRequestException
{
    public TenantContactEmailInvalidException(int maxLength)
        : base(
            errorCode: "TEN_004_CONTACT_EMAIL_INVALID",
            message: $"Contact email must be a valid email address of at most {maxLength} characters."
        ) { }
}
