using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.Users.GetUserById;

public class GetUserByIdQueryHandler : IRequestHandler<GetUserByIdQuery, GetUserByIdResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;

    public GetUserByIdQueryHandler(IUserRepository userRepository, ICurrentUserService currentUser)
    {
        _userRepository = userRepository;
        _currentUser = currentUser;
    }

    public async Task<GetUserByIdResponse> Handle(
        GetUserByIdQuery request,
        CancellationToken cancellationToken
    )
    {
        // Tenant-scoped lookup: users of other tenants surface as not found, not as forbidden
        var user =
            await _userRepository.GetByIdAsync(
                request.UserId,
                _currentUser.TenantId,
                cancellationToken
            ) ?? throw new ResourceNotFoundException("User", request.UserId.ToString());

        return new GetUserByIdResponse(user);
    }
}
