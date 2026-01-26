using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using MediatR;

namespace FixIt.Application.Features.Users.GetUsers;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, GetUsersResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IQueryableExecutor _queryableExecutor;

    public GetUsersQueryHandler(
        IUserRepository userRepository,
        ICurrentUserService currentUser,
        IQueryableExecutor queryableExecutor
    )
    {
        _userRepository = userRepository;
        _currentUser = currentUser;
        _queryableExecutor = queryableExecutor;
    }

    public async Task<GetUsersResponse> Handle(
        GetUsersQuery request,
        CancellationToken cancellationToken
    )
    {
        var tenantId = _currentUser.TenantId;

        var queryable = _userRepository.GetByTenantId(tenantId);

        var totalCount = await _queryableExecutor.CountAsync(queryable, cancellationToken);
        var items = await _queryableExecutor.ToListAsync(
            queryable.Skip((request.Page - 1) * request.PageSize).Take(request.PageSize),
            cancellationToken
        );

        return new GetUsersResponse(items, request.Page, request.PageSize, totalCount);
    }
}
