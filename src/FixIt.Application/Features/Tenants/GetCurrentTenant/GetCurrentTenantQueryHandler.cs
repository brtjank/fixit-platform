using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.Tenants.GetCurrentTenant;

public class GetCurrentTenantQueryHandler
    : IRequestHandler<GetCurrentTenantQuery, GetCurrentTenantResponse>
{
    private readonly ITenantRepository _tenantRepository;
    private readonly ICurrentUserService _currentUser;

    public GetCurrentTenantQueryHandler(
        ITenantRepository tenantRepository,
        ICurrentUserService currentUser
    )
    {
        _tenantRepository = tenantRepository;
        _currentUser = currentUser;
    }

    public async Task<GetCurrentTenantResponse> Handle(
        GetCurrentTenantQuery request,
        CancellationToken cancellationToken
    )
    {
        var tenantId = _currentUser.TenantId;
        var tenant =
            await _tenantRepository.GetByIdAsync(tenantId, cancellationToken)
            ?? throw new ResourceNotFoundException("Tenant", tenantId.ToString());

        return new GetCurrentTenantResponse(tenant);
    }
}
