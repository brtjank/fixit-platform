namespace FixIt.Application.Features.Tenants.UpdateCurrentTenant;

// No Plan: it is read-only for tenants, and an incoming "plan" property is simply ignored
public record UpdateCurrentTenantRequest(
    string? Name,
    string? Description,
    string? ContactEmail,
    string? Phone,
    string? Address,
    string? Timezone
);
