using FixIt.Application.Common;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.Users.ChangeOwnPassword;

public class ChangeOwnPasswordCommandHandler : IRequestHandler<ChangeOwnPasswordCommand, ChangeOwnPasswordResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUser;
    private readonly IJwtTokenService _jwtTokenService;

    public ChangeOwnPasswordCommandHandler(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        ICurrentUserService currentUser,
        IJwtTokenService jwtTokenService
    )
    {
        _jwtTokenService = jwtTokenService;
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _currentUser = currentUser;
    }

    public async Task<ChangeOwnPasswordResponse> Handle(
        ChangeOwnPasswordCommand request,
        CancellationToken cancellationToken
    )
    {
        var user =
            await _userRepository.GetByIdAsync(
                _currentUser.UserId,
                _currentUser.TenantId,
                cancellationToken
            ) ?? throw new ResourceNotFoundException("User", _currentUser.UserId.ToString());

        // Re-proving the current password stops a hijacked session from silently taking over
        // the account; an account without a hash has nothing to prove, so it is a mismatch too
        if (
            user.PasswordHash is null
            || !_passwordHasher.Verify(user.PasswordHash, request.CurrentPassword)
        )
            throw new UserPasswordMismatchException();

        user.SetPasswordHash(_passwordHasher.HashValidPassword(request.NewPassword));
        await _userRepository.UpdateAsync(user, cancellationToken);

        // SetPasswordHash bumped TokenVersion, so every existing token (this one included) is now
        // revoked; the new token carries the new version
        return new ChangeOwnPasswordResponse(_jwtTokenService.GenerateToken(user));
    }
}
