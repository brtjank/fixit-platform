using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Enums;
using MediatR;

namespace FixIt.Application.Features.Dashboard.GetRecentActivity;

public class GetRecentActivityQueryHandler
    : IRequestHandler<GetRecentActivityQuery, GetRecentActivityResponse>
{
    // Used when an actor is not recorded (automatic changes) or no longer resolvable
    public const string SystemActorName = "System";
    public const string CreatedIdPrefix = "created:";

    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly IServiceLogRepository _serviceLogRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IQueryableExecutor _queryableExecutor;

    public GetRecentActivityQueryHandler(
        IServiceRequestRepository serviceRequestRepository,
        IServiceLogRepository serviceLogRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUser,
        IQueryableExecutor queryableExecutor
    )
    {
        _serviceRequestRepository = serviceRequestRepository;
        _serviceLogRepository = serviceLogRepository;
        _userRepository = userRepository;
        _currentUser = currentUser;
        _queryableExecutor = queryableExecutor;
    }

    public async Task<GetRecentActivityResponse> Handle(
        GetRecentActivityQuery request,
        CancellationToken cancellationToken
    )
    {
        var limit = Math.Clamp(
            request.Limit ?? GetRecentActivityQuery.DefaultLimit,
            GetRecentActivityQuery.MinLimit,
            GetRecentActivityQuery.MaxLimit
        );
        var tenantId = _currentUser.TenantId;
        var requests = _serviceRequestRepository.GetByTenantId(tenantId);
        var users = _userRepository.GetByTenantId(tenantId);

        // Each source is capped at `limit` in the database: the newest `limit` items of the merged
        // feed can never include an item that is not among the newest `limit` of its own source.
        // The inner join drops logs whose request was soft-deleted.
        var logs = await _queryableExecutor.ToListAsync(
            _serviceLogRepository
                .GetByTenantId(tenantId)
                .Join(
                    requests,
                    l => l.ServiceRequestId,
                    r => r.Id,
                    (l, r) => new { Log = l, r.Title }
                )
                .OrderByDescending(x => x.Log.CreatedAt)
                .ThenByDescending(x => x.Log.Id)
                .Take(limit)
                .Select(x => new
                {
                    x.Log.Id,
                    x.Log.ServiceRequestId,
                    x.Title,
                    x.Log.PreviousStatus,
                    x.Log.NewStatus,
                    x.Log.Notes,
                    x.Log.CreatedAt,
                    ActorName = users
                        .Where(u => u.Id == x.Log.ChangedByUserId)
                        .Select(u => u.FirstName + " " + u.LastName)
                        .FirstOrDefault(),
                }),
            cancellationToken
        );

        var created = await _queryableExecutor.ToListAsync(
            requests
                .OrderByDescending(r => r.CreatedAt)
                .ThenByDescending(r => r.Id)
                .Take(limit)
                .Select(r => new
                {
                    r.Id,
                    r.Title,
                    r.CreatedAt,
                    CustomerName = users
                        .Where(u => u.Id == r.CustomerId)
                        .Select(u => u.FirstName + " " + u.LastName)
                        .FirstOrDefault(),
                }),
            cancellationToken
        );

        var items = logs.Select(l => new ActivityItem(
                Id: l.Id.ToString(),
                Type: TypeFor(l.NewStatus),
                ServiceRequestId: l.ServiceRequestId,
                ServiceRequestTitle: l.Title,
                ActorName: l.ActorName ?? SystemActorName,
                OccurredAt: l.CreatedAt,
                Detail: string.IsNullOrWhiteSpace(l.Notes)
                    ? $"{l.PreviousStatus} → {l.NewStatus}"
                    : l.Notes
            ))
            .Concat(
                created.Select(r => new ActivityItem(
                    Id: CreatedIdPrefix + r.Id,
                    Type: ActivityTypes.Created,
                    ServiceRequestId: r.Id,
                    ServiceRequestTitle: r.Title,
                    ActorName: r.CustomerName ?? SystemActorName,
                    OccurredAt: r.CreatedAt,
                    Detail: null
                ))
            )
            .OrderByDescending(i => i.OccurredAt)
            .ThenByDescending(i => i.Id, StringComparer.Ordinal)
            .Take(limit)
            .ToList();

        return new GetRecentActivityResponse(items);
    }

    private static string TypeFor(ServiceRequestStatus newStatus) =>
        newStatus switch
        {
            ServiceRequestStatus.Assigned => ActivityTypes.Assigned,
            ServiceRequestStatus.Completed => ActivityTypes.Completed,
            ServiceRequestStatus.Cancelled => ActivityTypes.Cancelled,
            _ => ActivityTypes.StatusChanged,
        };
}
