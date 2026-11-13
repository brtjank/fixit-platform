using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.Auth.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IPasswordHasher _passwordHasher;

    public LoginCommandHandler(
        IUserRepository userRepository,
        IJwtTokenService jwtTokenService,
        IPasswordHasher passwordHasher
    )
    {
        _userRepository = userRepository;
        _jwtTokenService = jwtTokenService;
        _passwordHasher = passwordHasher;
    }

    public async Task<LoginResponse> Handle(
        LoginCommand request,
        CancellationToken cancellationToken
    )
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);

        // Every failure maps to the same exception so callers cannot tell an unknown email
        // from a wrong password or a disabled account
        if (
            user is null
            || !user.IsActive
            || user.IsDeleted
            || user.PasswordHash is null
            || !_passwordHasher.Verify(user.PasswordHash, request.Password)
        )
            throw new UserNotAuthenticatedException();

        var token = _jwtTokenService.GenerateToken(user);

        return new LoginResponse(token, user.Id, user.TenantId, user.Role.ToString());
    }
}
