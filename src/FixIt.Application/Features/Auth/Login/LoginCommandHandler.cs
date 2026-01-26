using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.Auth.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenService _jwtTokenService;

    public LoginCommandHandler(IUserRepository userRepository, IJwtTokenService jwtTokenService)
    {
        _userRepository = userRepository;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<LoginResponse> Handle(
        LoginCommand request,
        CancellationToken cancellationToken
    )
    {
        // Note: In Phase 4, we're doing basic login without password hashing
        // This is a placeholder - in production, you'd verify password hash
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);

        if (user == null)
            throw new UserNotAuthenticatedException();

        // TODO: Verify password hash (Phase 4 - basic implementation)
        // For now, we'll just check if user exists and is active
        if (!user.IsActive || user.IsDeleted)
            throw new UserNotAuthenticatedException();

        var token = _jwtTokenService.GenerateToken(user);

        return new LoginResponse(token, user.Id, user.TenantId, user.Role.ToString());
    }
}
