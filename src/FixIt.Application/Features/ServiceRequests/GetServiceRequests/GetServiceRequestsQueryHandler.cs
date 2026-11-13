using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.ServiceRequests.GetServiceRequests;

public class GetServiceRequestsQueryHandler
    : IRequestHandler<GetServiceRequestsQuery, GetServiceRequestsResponse>
{
    public const int SearchMaxLength = 200;

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
        var sort = ServiceRequestSort.Parse(request.Sort);
        var search = request.Search?.Trim();
        if (search?.Length > SearchMaxLength)
            throw new ServiceRequestSearchTooLongException(SearchMaxLength);

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

        // Customers may only ever see their own service requests; any customerId filter is ignored
        if (_currentUser.Role == nameof(UserRole.Customer))
        {
            var currentUserId = _currentUser.UserId;
            queryable = queryable.Where(sr => sr.CustomerId == currentUserId);
        }
        else if (request.CustomerId.HasValue)
        {
            queryable = queryable.Where(sr => sr.CustomerId == request.CustomerId.Value);
        }

        if (!string.IsNullOrEmpty(search))
        {
            // ToLower().Contains() keeps the filter translatable to SQL (LOWER(col) substring match)
            // instead of falling back to client-side evaluation
            var term = search.ToLower();
            queryable = queryable.Where(sr =>
                sr.Title.ToLower().Contains(term) || sr.Description.ToLower().Contains(term)
            );
        }

        var totalCount = await _queryableExecutor.CountAsync(queryable, cancellationToken);
        var items = await _queryableExecutor.ToListAsync(
            sort.Apply(queryable)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize),
            cancellationToken
        );

        return new GetServiceRequestsResponse(items, request.Page, request.PageSize, totalCount);
    }
}
