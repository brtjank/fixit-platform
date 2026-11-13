using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.Users.DeactivateUser;

public class DeactivateUserCommandHandler
    : IRequestHandler<DeactivateUserCommand, DeactivateUserResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;

    public DeactivateUserCommandHandler(
        IUserRepository userRepository,
        ICurrentUserService currentUser
    )
    {
        _userRepository = userRepository;
        _currentUser = currentUser;
    }

    public async Task<DeactivateUserResponse> Handle(
        DeactivateUserCommand request,
        CancellationToken cancellationToken
    )
    {
        // Checked before the lookup: an admin locking themselves out is never valid
        if (request.UserId == _currentUser.UserId)
            throw new UserSelfDeactivateException();

        var user =
            await _userRepository.GetByIdAsync(
                request.UserId,
                _currentUser.TenantId,
                cancellationToken
            ) ?? throw new ResourceNotFoundException("User", request.UserId.ToString());

        // Idempotent: deactivating an inactive user is a no-op and does not hit the database
        if (user.IsActive)
        {
            user.Deactivate();
            await _userRepository.UpdateAsync(user, cancellationToken);
        }

        return new DeactivateUserResponse(user);
    }
}
