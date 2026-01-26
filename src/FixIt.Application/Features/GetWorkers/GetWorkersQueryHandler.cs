using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Enums;
using MediatR;

namespace FixIt.Application.Features.GetWorkers;

public class GetWorkersQueryHandler : IRequestHandler<GetWorkersQuery, GetWorkersResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IQueryableExecutor _queryableExecutor;

    public GetWorkersQueryHandler(
        IUserRepository userRepository,
        ICurrentUserService currentUser,
        IQueryableExecutor queryableExecutor
    )
    {
        _userRepository = userRepository;
        _currentUser = currentUser;
        _queryableExecutor = queryableExecutor;
    }

    public async Task<GetWorkersResponse> Handle(
        GetWorkersQuery request,
        CancellationToken cancellationToken
    )
    {
        var tenantId = _currentUser.TenantId;

        var queryable = _userRepository
            .GetByTenantId(tenantId)
            .Where(u => u.Role == UserRole.Worker);

        var totalCount = await _queryableExecutor.CountAsync(queryable, cancellationToken);
        var items = await _queryableExecutor.ToListAsync(
            queryable.Skip((request.Page - 1) * request.PageSize).Take(request.PageSize),
            cancellationToken
        );

        return new GetWorkersResponse(items, request.Page, request.PageSize, totalCount);
    }
}
