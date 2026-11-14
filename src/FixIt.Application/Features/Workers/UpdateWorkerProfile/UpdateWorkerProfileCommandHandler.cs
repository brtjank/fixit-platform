using FixIt.Application.Common;
using FixIt.Application.Common.Exceptions;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.Workers.UpdateWorkerProfile;

public class UpdateWorkerProfileCommandHandler
    : IRequestHandler<UpdateWorkerProfileCommand, UpdateWorkerProfileResponse>
{
    private readonly IWorkerProfileRepository _workerProfileRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;

    public UpdateWorkerProfileCommandHandler(
        IWorkerProfileRepository workerProfileRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUser
    )
    {
        _workerProfileRepository = workerProfileRepository;
        _userRepository = userRepository;
        _currentUser = currentUser;
    }

    public async Task<UpdateWorkerProfileResponse> Handle(
        UpdateWorkerProfileCommand request,
        CancellationToken cancellationToken
    )
    {
        var tenantId = _currentUser.TenantId;

        // Workers may only edit their own profile; reported as not found so other workers' ids
        // are not confirmed to exist
        if (
            _currentUser.Role == nameof(UserRole.Worker)
            && request.UserId != _currentUser.UserId
        )
            throw new ResourceNotFoundException("Worker", request.UserId.ToString());

        var user = await _userRepository.GetByIdAsync(request.UserId, tenantId, cancellationToken);
        if (user is null || user.Role != UserRole.Worker)
            throw new ResourceNotFoundException("Worker", request.UserId.ToString());

        var profile = await _workerProfileRepository.GetByUserIdAsync(
            request.UserId,
            tenantId,
            cancellationToken
        );

        // Upsert: profiles are not created together with worker accounts, so the first save creates one
        if (profile is null)
        {
            profile = new WorkerProfile(
                tenantId,
                request.UserId,
                request.Specialization,
                request.PhoneNumber
            );
            ApplyAvailability(profile, request.IsAvailable);

            // Two first saves at once both see "no profile"; the (TenantId, UserId) unique index
            // rejects the second one
            try
            {
                await _workerProfileRepository.AddAsync(profile, cancellationToken);
            }
            catch (UniqueConstraintViolationException ex)
                when (ex.ConstraintName == UniqueConstraints.WorkerProfileUser)
            {
                throw new WorkerProfileConcurrentCreateException(request.UserId);
            }
        }
        else
        {
            profile.UpdateSpecialization(request.Specialization);
            profile.UpdatePhoneNumber(request.PhoneNumber);
            ApplyAvailability(profile, request.IsAvailable);
            await _workerProfileRepository.UpdateAsync(profile, cancellationToken);
        }

        return new UpdateWorkerProfileResponse(profile);
    }

    private static void ApplyAvailability(WorkerProfile profile, bool isAvailable)
    {
        if (isAvailable)
            profile.SetAvailable();
        else
            profile.SetUnavailable();
    }
}
