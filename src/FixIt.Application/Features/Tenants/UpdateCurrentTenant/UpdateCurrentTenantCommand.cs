using MediatR;

namespace FixIt.Application.Features.Tenants.UpdateCurrentTenant;

public record UpdateCurrentTenantCommand(
    string? Name,
    string? Description,
    string? ContactEmail,
    string? Phone,
    string? Address,
    string? Timezone
) : IRequest<UpdateCurrentTenantResponse>;
