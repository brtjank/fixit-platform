using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.Users.UpdateUser;

public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, UpdateUserResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly IWorkerProfileRepository _workerProfileRepository;
    private readonly ICurrentUserService _currentUser;

    public UpdateUserCommandHandler(
        IUserRepository userRepository,
        IWorkerProfileRepository workerProfileRepository,
        ICurrentUserService currentUser
    )
    {
        _userRepository = userRepository;
        _workerProfileRepository = workerProfileRepository;
        _currentUser = currentUser;
    }

    public async Task<UpdateUserResponse> Handle(
        UpdateUserCommand request,
        CancellationToken cancellationToken
    )
    {
        UserRoleGuard.EnsureDefined(request.Role);

        var tenantId = _currentUser.TenantId;
        var user =
            await _userRepository.GetByIdAsync(request.UserId, tenantId, cancellationToken)
            ?? throw new ResourceNotFoundException("User", request.UserId.ToString());

        // An admin demoting themselves could leave the tenant without any admin
        if (user.Id == _currentUser.UserId && user.Role != request.Role)
            throw new UserSelfRoleChangeException();

        var becomesWorker = user.Role != UserRole.Worker && request.Role == UserRole.Worker;

        user.UpdateName(request.FirstName, request.LastName);
        user.ChangeRole(request.Role);
        await _userRepository.UpdateAsync(user, cancellationToken);

        // Mirrors CreateUser: a promoted worker should show up in /workers/profiles immediately
        if (
            becomesWorker
            && await _workerProfileRepository.GetByUserIdAsync(user.Id, tenantId, cancellationToken)
                is null
        )
            await _workerProfileRepository.AddAsync(
                new WorkerProfile(tenantId, user.Id),
                cancellationToken
            );

        return new UpdateUserResponse(user);
    }
}
