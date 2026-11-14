using FixIt.Application.Common;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Enums;
using MediatR;

namespace FixIt.Application.Features.Workers.GetWorkerWorkload;

public class GetWorkerWorkloadQueryHandler
    : IRequestHandler<GetWorkerWorkloadQuery, GetWorkerWorkloadResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly IServiceLogRepository _serviceLogRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IQueryableExecutor _queryableExecutor;
    private readonly IDateTimeProvider _clock;

    public GetWorkerWorkloadQueryHandler(
        IUserRepository userRepository,
        IServiceRequestRepository serviceRequestRepository,
        IServiceLogRepository serviceLogRepository,
        ICurrentUserService currentUser,
        IQueryableExecutor queryableExecutor,
        IDateTimeProvider clock
    )
    {
        _userRepository = userRepository;
        _serviceRequestRepository = serviceRequestRepository;
        _serviceLogRepository = serviceLogRepository;
        _currentUser = currentUser;
        _queryableExecutor = queryableExecutor;
        _clock = clock;
    }

    public async Task<GetWorkerWorkloadResponse> Handle(
        GetWorkerWorkloadQuery request,
        CancellationToken cancellationToken
    )
    {
        var tenantId = _currentUser.TenantId;
        var window = TimeWindow.LastDays(_clock.UtcNow);

        // Inactive workers stay in the list: they may still hold assigned requests
        var workerIds = await _queryableExecutor.ToListAsync(
            _userRepository
                .GetByTenantId(tenantId)
                .Where(u => u.Role == UserRole.Worker)
                .OrderBy(u => u.CreatedAt)
                .ThenBy(u => u.Id)
                .Select(u => u.Id),
            cancellationToken
        );

        var requests = _serviceRequestRepository.GetByTenantId(tenantId);

        // Pending requests cannot have a worker, so Assigned + InProgress is the worker's open load
        var openCounts = await _queryableExecutor.ToListAsync(
            requests
                .Where(r =>
                    r.AssignedWorkerId != null
                    && (
                        r.Status == ServiceRequestStatus.Assigned
                        || r.Status == ServiceRequestStatus.InProgress
                    )
                )
                .GroupBy(r => r.AssignedWorkerId)
                .Select(g => new
                {
                    WorkerId = g.Key,
                    Open = g.Count(),
                    InProgress = g.Count(r => r.Status == ServiceRequestStatus.InProgress),
                }),
            cancellationToken
        );

        var completedCounts = await _queryableExecutor.ToListAsync(
            ServiceRequestCompletions
                .WithCompletedAt(requests, _serviceLogRepository.GetByTenantId(tenantId))
                .CompletedWithin(window)
                .Where(c => c.AssignedWorkerId != null)
                .GroupBy(c => c.AssignedWorkerId)
                .Select(g => new { WorkerId = g.Key, Count = g.Count() }),
            cancellationToken
        );

        var openByWorker = openCounts.ToDictionary(x => x.WorkerId!.Value);
        var completedByWorker = completedCounts.ToDictionary(x => x.WorkerId!.Value, x => x.Count);

        var workload = workerIds
            .Select(id =>
            {
                var open = openByWorker.GetValueOrDefault(id);
                return new WorkerWorkload(
                    id,
                    open?.Open ?? 0,
                    open?.InProgress ?? 0,
                    completedByWorker.GetValueOrDefault(id)
                );
            })
            .ToList();

        return new GetWorkerWorkloadResponse(workload);
    }
}
