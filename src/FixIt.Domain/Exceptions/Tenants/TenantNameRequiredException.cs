namespace FixIt.Domain.Exceptions;

public class TenantNameRequiredException : BadRequestException
{
    public TenantNameRequiredException()
        : base(
            errorCode: "TEN_001_NAME_REQUIRED",
            message: "Tenant name is required and cannot be empty."
        ) { }
}
