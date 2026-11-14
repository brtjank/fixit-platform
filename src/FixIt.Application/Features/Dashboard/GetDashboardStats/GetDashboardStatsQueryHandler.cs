using FixIt.Application.Common;
using FixIt.Application.Features.Dashboard.Common;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using MediatR;

namespace FixIt.Application.Features.Dashboard.GetDashboardStats;

public class GetDashboardStatsQueryHandler
    : IRequestHandler<GetDashboardStatsQuery, GetDashboardStatsResponse>
{
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly IServiceLogRepository _serviceLogRepository;
    private readonly IUserRepository _userRepository;
    private readonly IWorkerProfileRepository _workerProfileRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IQueryableExecutor _queryableExecutor;
    private readonly IDateTimeProvider _clock;

    public GetDashboardStatsQueryHandler(
        IServiceRequestRepository serviceRequestRepository,
        IServiceLogRepository serviceLogRepository,
        IUserRepository userRepository,
        IWorkerProfileRepository workerProfileRepository,
        ICurrentUserService currentUser,
        IQueryableExecutor queryableExecutor,
        IDateTimeProvider clock
    )
    {
        _serviceRequestRepository = serviceRequestRepository;
        _serviceLogRepository = serviceLogRepository;
        _userRepository = userRepository;
        _workerProfileRepository = workerProfileRepository;
        _currentUser = currentUser;
        _queryableExecutor = queryableExecutor;
        _clock = clock;
    }

    public async Task<GetDashboardStatsResponse> Handle(
        GetDashboardStatsQuery request,
        CancellationToken cancellationToken
    )
    {
        var tenantId = _currentUser.TenantId;
        var now = _clock.UtcNow;
        var current = TimeWindow.LastDays(now);
        var previous = TimeWindow.PreviousDays(now);

        var requests = _serviceRequestRepository.GetByTenantId(tenantId);
        var completions = ServiceRequestCompletions.WithCompletedAt(
            requests,
            _serviceLogRepository.GetByTenantId(tenantId)
        );

        var byStatus = await DashboardQueries.CountByStatusAsync(
            requests,
            _queryableExecutor,
            cancellationToken
        );
        var openRequests =
            byStatus[ServiceRequestStatus.Pending]
            + byStatus[ServiceRequestStatus.Assigned]
            + byStatus[ServiceRequestStatus.InProgress];

        var completedNow = await SummarizeAsync(completions.CompletedWithin(current), cancellationToken);
        var completedBefore = await SummarizeAsync(
            completions.CompletedWithin(previous),
            cancellationToken
        );

        var createdNow = await CountCreatedAsync(requests, current, cancellationToken);
        var createdBefore = await CountCreatedAsync(requests, previous, cancellationToken);

        var activeWorkers = _userRepository
            .GetByTenantId(tenantId)
            .Where(u => u.Role == UserRole.Worker && u.IsActive);
        var profiles = _workerProfileRepository.GetByTenantId(tenantId);

        var activeWorkerCount = await _queryableExecutor.CountAsync(activeWorkers, cancellationToken);
        // A worker without a profile counts as available: availability is opt-out, and profiles
        // are only created on the first edit
        var availableWorkerCount = await _queryableExecutor.CountAsync(
            activeWorkers.Where(u => !profiles.Any(p => p.UserId == u.Id && !p.IsAvailable)),
            cancellationToken
        );

        // Without a previous baseline a resolution-time trend would be meaningless (+100% for
        // simply having completions), so it is reported as no change
        var resolutionTrend =
            completedBefore.Count == 0
                ? 0
                : DashboardMath.PercentChange(completedNow.AvgHours, completedBefore.AvgHours);

        return new GetDashboardStatsResponse(
            OpenRequests: openRequests,
            PendingUnassigned: byStatus[ServiceRequestStatus.Pending],
            InProgress: byStatus[ServiceRequestStatus.InProgress],
            CompletedLast30Days: completedNow.Count,
            AvgResolutionHours: DashboardMath.Round1(completedNow.AvgHours),
            ActiveWorkers: activeWorkerCount,
            AvailableWorkers: availableWorkerCount,
            Trends: new DashboardTrends(
                OpenRequests: DashboardMath.PercentChange(createdNow, createdBefore),
                CompletedLast30Days: DashboardMath.PercentChange(
                    completedNow.Count,
                    completedBefore.Count
                ),
                AvgResolutionHours: resolutionTrend
            )
        );
    }

    private async Task<CompletionSummary> SummarizeAsync(
        IQueryable<CompletedServiceRequest> completions,
        CancellationToken cancellationToken
    )
    {
        // Grouping by a constant gives COUNT and AVG in a single round trip
        var rows = await _queryableExecutor.ToListAsync(
            completions
                .GroupBy(_ => 1)
                .Select(g => new CompletionSummary(
                    g.Count(),
                    g.Average(c => (c.CompletedAt - c.CreatedAt).TotalHours)
                )),
            cancellationToken
        );

        return rows.FirstOrDefault() ?? new CompletionSummary(0, 0);
    }

    private Task<int> CountCreatedAsync(
        IQueryable<ServiceRequest> requests,
        TimeWindow window,
        CancellationToken cancellationToken
    )
    {
        return _queryableExecutor.CountAsync(
            requests.Where(r => r.CreatedAt > window.Start && r.CreatedAt <= window.End),
            cancellationToken
        );
    }

    private record CompletionSummary(int Count, double AvgHours);
}
