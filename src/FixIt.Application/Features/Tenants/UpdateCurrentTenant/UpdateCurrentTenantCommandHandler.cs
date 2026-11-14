using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.Tenants.UpdateCurrentTenant;

public class UpdateCurrentTenantCommandHandler
    : IRequestHandler<UpdateCurrentTenantCommand, UpdateCurrentTenantResponse>
{
    private readonly ITenantRepository _tenantRepository;
    private readonly ICurrentUserService _currentUser;

    public UpdateCurrentTenantCommandHandler(
        ITenantRepository tenantRepository,
        ICurrentUserService currentUser
    )
    {
        _tenantRepository = tenantRepository;
        _currentUser = currentUser;
    }

    public async Task<UpdateCurrentTenantResponse> Handle(
        UpdateCurrentTenantCommand request,
        CancellationToken cancellationToken
    )
    {
        // The tenant always comes from the token, never from the request, so an admin can only
        // ever edit their own organisation
        var tenantId = _currentUser.TenantId;
        var tenant =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken)
            ?? throw new ResourceNotFoundException("Tenant", tenantId.ToString());

        tenant.UpdateSettings(
            request.Name,
            request.Description,
            request.ContactEmail,
            request.Phone,
            request.Address,
            request.Timezone
        );
        await _tenantRepository.UpdateAsync(tenant, cancellationToken);

        return new UpdateCurrentTenantResponse(tenant);
    }
}
