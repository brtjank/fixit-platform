using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.Users.ActivateUser;

public class ActivateUserCommandHandler : IRequestHandler<ActivateUserCommand, ActivateUserResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;

    public ActivateUserCommandHandler(IUserRepository userRepository, ICurrentUserService currentUser)
    {
        _userRepository = userRepository;
        _currentUser = currentUser;
    }

    public async Task<ActivateUserResponse> Handle(
        ActivateUserCommand request,
        CancellationToken cancellationToken
    )
    {
        var user =
            await _userRepository.GetByIdAsync(
                request.UserId,
                _currentUser.TenantId,
                cancellationToken
            ) ?? throw new ResourceNotFoundException("User", request.UserId.ToString());

        // Idempotent: activating an active user is a no-op and does not hit the database
        if (!user.IsActive)
        {
            user.Activate();
            await _userRepository.UpdateAsync(user, cancellationToken);
        }

        return new ActivateUserResponse(user);
    }
}
