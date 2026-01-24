namespace FixIt.Domain.Exceptions;

public class TenantCannotBeActivatedException : BadRequestException
{
    public Guid TenantId { get; }

    public TenantCannotBeActivatedException(Guid tenantId)
        : base($"Cannot activate tenant {tenantId}. Tenant is deleted.")
    {
        TenantId = tenantId;
    }
}
