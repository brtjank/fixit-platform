using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.Workers.GetWorkerProfile;

public class GetWorkerProfileQueryHandler
    : IRequestHandler<GetWorkerProfileQuery, GetWorkerProfileResponse>
{
    private readonly IWorkerProfileRepository _workerProfileRepository;
    private readonly ICurrentUserService _currentUser;

    public GetWorkerProfileQueryHandler(
        IWorkerProfileRepository workerProfileRepository,
        ICurrentUserService currentUser
    )
    {
        _workerProfileRepository = workerProfileRepository;
        _currentUser = currentUser;
    }

    public async Task<GetWorkerProfileResponse> Handle(
        GetWorkerProfileQuery request,
        CancellationToken cancellationToken
    )
    {
        var profile =
            await _workerProfileRepository.GetByUserIdAsync(
                request.UserId,
                _currentUser.TenantId,
                cancellationToken
            ) ?? throw new ResourceNotFoundException("WorkerProfile", request.UserId.ToString());

        return new GetWorkerProfileResponse(profile);
    }
}
