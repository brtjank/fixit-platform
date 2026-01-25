namespace FixIt.Domain.Exceptions;

public class TenantCannotBeActivatedException : BadRequestException
{
    public Guid TenantId { get; }

    public TenantCannotBeActivatedException(Guid tenantId)
        : base(
            errorCode: "TEN_002_CANNOT_ACTIVATE",
            message: $"Cannot activate tenant {tenantId}. Tenant is deleted."
        )
    {
        TenantId = tenantId;
    }
}
