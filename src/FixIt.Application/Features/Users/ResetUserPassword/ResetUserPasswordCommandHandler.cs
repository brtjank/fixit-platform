using FixIt.Application.Common;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.Users.ResetUserPassword;

/// <summary>
/// Admin-initiated reset; no current password is required because there is no email reset flow yet.
/// </summary>
public class ResetUserPasswordCommandHandler : IRequestHandler<ResetUserPasswordCommand>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUser;

    public ResetUserPasswordCommandHandler(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        ICurrentUserService currentUser
    )
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _currentUser = currentUser;
    }

    public async Task Handle(ResetUserPasswordCommand request, CancellationToken cancellationToken)
    {
        var user =
            await _userRepository.GetByIdAsync(
                request.UserId,
                _currentUser.TenantId,
                cancellationToken
            ) ?? throw new ResourceNotFoundException("User", request.UserId.ToString());

        user.SetPasswordHash(_passwordHasher.HashValidPassword(request.NewPassword));
        await _userRepository.UpdateAsync(user, cancellationToken);
    }
}
