using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Enums;
using MediatR;

namespace FixIt.Application.Features.Dashboard.GetRequestVolume;

public class GetRequestVolumeQueryHandler
    : IRequestHandler<GetRequestVolumeQuery, GetRequestVolumeResponse>
{
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly IServiceLogRepository _serviceLogRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IQueryableExecutor _queryableExecutor;
    private readonly IDateTimeProvider _clock;

    public GetRequestVolumeQueryHandler(
        IServiceRequestRepository serviceRequestRepository,
        IServiceLogRepository serviceLogRepository,
        ICurrentUserService currentUser,
        IQueryableExecutor queryableExecutor,
        IDateTimeProvider clock
    )
    {
        _serviceRequestRepository = serviceRequestRepository;
        _serviceLogRepository = serviceLogRepository;
        _currentUser = currentUser;
        _queryableExecutor = queryableExecutor;
        _clock = clock;
    }

    public async Task<GetRequestVolumeResponse> Handle(
        GetRequestVolumeQuery request,
        CancellationToken cancellationToken
    )
    {
        // Out-of-range values are clamped instead of rejected: the chart always has something sane to draw
        var days = Math.Clamp(
            request.Days ?? GetRequestVolumeQuery.DefaultDays,
            GetRequestVolumeQuery.MinDays,
            GetRequestVolumeQuery.MaxDays
        );
        var tenantId = _currentUser.TenantId;
        var today = _clock.UtcNow.Date;
        var from = today.AddDays(-(days - 1));
        var to = today.AddDays(1);

        var created = await _queryableExecutor.ToListAsync(
            _serviceRequestRepository
                .GetByTenantId(tenantId)
                .Where(r => r.CreatedAt >= from && r.CreatedAt < to)
                .GroupBy(r => r.CreatedAt.Date)
                .Select(g => new { Day = g.Key, Count = g.Count() }),
            cancellationToken
        );

        var completed = await _queryableExecutor.ToListAsync(
            _serviceLogRepository
                .GetByTenantId(tenantId)
                .Where(l =>
                    l.NewStatus == ServiceRequestStatus.Completed
                    && l.CreatedAt >= from
                    && l.CreatedAt < to
                )
                .GroupBy(l => l.CreatedAt.Date)
                .Select(g => new { Day = g.Key, Count = g.Count() }),
            cancellationToken
        );

        var createdByDay = created.ToDictionary(x => DateOnly.FromDateTime(x.Day), x => x.Count);
        var completedByDay = completed.ToDictionary(x => DateOnly.FromDateTime(x.Day), x => x.Count);

        var points = Enumerable
            .Range(0, days)
            .Select(offset => DateOnly.FromDateTime(from.AddDays(offset)))
            .Select(day => new DailyVolumePoint(
                day,
                createdByDay.GetValueOrDefault(day),
                completedByDay.GetValueOrDefault(day)
            ))
            .ToList();

        return new GetRequestVolumeResponse(points);
    }
}
