using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using MediatR;

namespace FixIt.Application.Features.ServiceRequests.GetServiceRequests;

public class GetServiceRequestsQueryHandler
    : IRequestHandler<GetServiceRequestsQuery, GetServiceRequestsResponse>
{
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IQueryableExecutor _queryableExecutor;

    public GetServiceRequestsQueryHandler(
        IServiceRequestRepository serviceRequestRepository,
        ICurrentUserService currentUser,
        IQueryableExecutor queryableExecutor
    )
    {
        _serviceRequestRepository = serviceRequestRepository;
        _currentUser = currentUser;
        _queryableExecutor = queryableExecutor;
    }

    public async Task<GetServiceRequestsResponse> Handle(
        GetServiceRequestsQuery request,
        CancellationToken cancellationToken
    )
    {
        var tenantId = _currentUser.TenantId;

        var queryable = _serviceRequestRepository.GetByTenantId(tenantId);

        if (request.Status.HasValue)
        {
            queryable = queryable.Where(sr => sr.Status == request.Status.Value);
        }

        if (request.AssignedWorkerId.HasValue)
        {
            queryable = queryable.Where(sr =>
                sr.AssignedWorkerId == request.AssignedWorkerId.Value
            );
        }

        var totalCount = await _queryableExecutor.CountAsync(queryable, cancellationToken);
        var items = await _queryableExecutor.ToListAsync(
            queryable.Skip((request.Page - 1) * request.PageSize).Take(request.PageSize),
            cancellationToken
        );

        return new GetServiceRequestsResponse(items, request.Page, request.PageSize, totalCount);
    }
}
