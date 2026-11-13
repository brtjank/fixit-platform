using FixIt.Application.Features.Dashboard.Common;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using MediatR;

namespace FixIt.Application.Features.Dashboard.GetStatusBreakdown;

public class GetStatusBreakdownQueryHandler
    : IRequestHandler<GetStatusBreakdownQuery, GetStatusBreakdownResponse>
{
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IQueryableExecutor _queryableExecutor;

    public GetStatusBreakdownQueryHandler(
        IServiceRequestRepository serviceRequestRepository,
        ICurrentUserService currentUser,
        IQueryableExecutor queryableExecutor
    )
    {
        _serviceRequestRepository = serviceRequestRepository;
        _currentUser = currentUser;
        _queryableExecutor = queryableExecutor;
    }

    public async Task<GetStatusBreakdownResponse> Handle(
        GetStatusBreakdownQuery request,
        CancellationToken cancellationToken
    )
    {
        var counts = await DashboardQueries.CountByStatusAsync(
            _serviceRequestRepository.GetByTenantId(_currentUser.TenantId),
            _queryableExecutor,
            cancellationToken
        );

        var items = counts
            .OrderBy(x => x.Key)
            .Select(x => new StatusCount(x.Key, x.Value))
            .ToList();

        return new GetStatusBreakdownResponse(items);
    }
}
