using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using MediatR;

namespace FixIt.Application.Features.Notifications.GetUnreadNotificationCount;

public class GetUnreadNotificationCountQueryHandler
    : IRequestHandler<GetUnreadNotificationCountQuery, GetUnreadNotificationCountResponse>
{
    private readonly INotificationRepository _notificationRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IQueryableExecutor _queryableExecutor;

    public GetUnreadNotificationCountQueryHandler(
        INotificationRepository notificationRepository,
        ICurrentUserService currentUser,
        IQueryableExecutor queryableExecutor
    )
    {
        _notificationRepository = notificationRepository;
        _currentUser = currentUser;
        _queryableExecutor = queryableExecutor;
    }

    public async Task<GetUnreadNotificationCountResponse> Handle(
        GetUnreadNotificationCountQuery request,
        CancellationToken cancellationToken
    )
    {
        var count = await _queryableExecutor.CountAsync(
            _notificationRepository
                .GetByRecipient(_currentUser.UserId, _currentUser.TenantId)
                .Where(n => n.ReadAt == null),
            cancellationToken
        );

        return new GetUnreadNotificationCountResponse(count);
    }
}
