using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using MediatR;

namespace FixIt.Application.Features.Workers.GetWorkerProfiles;

public class GetWorkerProfilesQueryHandler
    : IRequestHandler<GetWorkerProfilesQuery, GetWorkerProfilesResponse>
{
    private readonly IWorkerProfileRepository _workerProfileRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IQueryableExecutor _queryableExecutor;

    public GetWorkerProfilesQueryHandler(
        IWorkerProfileRepository workerProfileRepository,
        ICurrentUserService currentUser,
        IQueryableExecutor queryableExecutor
    )
    {
        _workerProfileRepository = workerProfileRepository;
        _currentUser = currentUser;
        _queryableExecutor = queryableExecutor;
    }

    public async Task<GetWorkerProfilesResponse> Handle(
        GetWorkerProfilesQuery request,
        CancellationToken cancellationToken
    )
    {
        // Not paged: one profile per worker keeps the set small, and clients join it with the
        // worker list on their side.
        var queryable = _workerProfileRepository
            .GetByTenantId(_currentUser.TenantId)
            .OrderBy(wp => wp.CreatedAt)
            .ThenBy(wp => wp.Id);

        var profiles = await _queryableExecutor.ToListAsync(queryable, cancellationToken);

        return new GetWorkerProfilesResponse(profiles);
    }
}
