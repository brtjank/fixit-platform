using FixIt.Application.Common;
using FixIt.Application.Common.Exceptions;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.Users.CreateUser;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, CreateUserResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly IWorkerProfileRepository _workerProfileRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUser;

    public CreateUserCommandHandler(
        IUserRepository userRepository,
        IWorkerProfileRepository workerProfileRepository,
        IPasswordHasher passwordHasher,
        ICurrentUserService currentUser
    )
    {
        _userRepository = userRepository;
        _workerProfileRepository = workerProfileRepository;
        _passwordHasher = passwordHasher;
        _currentUser = currentUser;
    }

    public async Task<CreateUserResponse> Handle(
        CreateUserCommand request,
        CancellationToken cancellationToken
    )
    {
        UserRoleGuard.EnsureDefined(request.Role);

        var tenantId = _currentUser.TenantId;
        var email = request.Email?.Trim() ?? string.Empty;

        // Construct first so the domain rules (email/name required) run before any I/O
        var user = new User(tenantId, email, request.FirstName, request.LastName, request.Role);
        user.SetPasswordHash(_passwordHasher.HashValidPassword(request.Password));

        if (await _userRepository.EmailExistsAsync(email, cancellationToken))
            throw new UserEmailTakenException(email);

        // The check above can race with a concurrent create; the unique index is the real guard
        try
        {
            await _userRepository.AddAsync(user, cancellationToken);
        }
        catch (UniqueConstraintViolationException ex)
            when (ex.ConstraintName == UniqueConstraints.UserEmail)
        {
            throw new UserEmailTakenException(email);
        }

        // Workers get an empty profile right away so they appear in /workers/profiles without an
        // extra admin step. Saved separately (no shared transaction); if this fails the profile is
        // still created later by the upsert in UpdateWorkerProfile.
        if (user.Role == UserRole.Worker)
            await _workerProfileRepository.AddAsync(
                new WorkerProfile(tenantId, user.Id),
                cancellationToken
            );

        return new CreateUserResponse(user);
    }
}
