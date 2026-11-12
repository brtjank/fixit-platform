using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.Users.GetCurrentUser;

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, GetCurrentUserResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly ITenantRepository _tenantRepository;
    private readonly ICurrentUserService _currentUser;

    public GetCurrentUserQueryHandler(
        IUserRepository userRepository,
        ITenantRepository tenantRepository,
        ICurrentUserService currentUser
    )
    {
        _userRepository = userRepository;
        _tenantRepository = tenantRepository;
        _currentUser = currentUser;
    }

    public async Task<GetCurrentUserResponse> Handle(
        GetCurrentUserQuery request,
        CancellationToken cancellationToken
    )
    {
        var userId = _currentUser.UserId;
        var tenantId = _currentUser.TenantId;

        var user =
            await _userRepository.GetByIdAsync(userId, tenantId, cancellationToken)
            ?? throw new ResourceNotFoundException("User", userId.ToString());

        // Tenant lookup is best-effort: a missing tenant should not break the current-user flow
        var tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        return new GetCurrentUserResponse(
            user.Id,
            user.TenantId,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role,
            user.IsActive,
            user.CreatedAt,
            user.IsDeleted,
            tenant?.Name ?? string.Empty
        );
    }
}
