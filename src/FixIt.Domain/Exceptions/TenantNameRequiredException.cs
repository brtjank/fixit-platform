namespace FixIt.Domain.Exceptions;

public class TenantNameRequiredException : BadRequestException
{
    public TenantNameRequiredException()
        : base("Tenant name is required and cannot be empty.") { }
}
