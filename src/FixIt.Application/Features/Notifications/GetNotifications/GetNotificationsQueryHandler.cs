using FixIt.Application.Features.Notifications.Common;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using MediatR;

namespace FixIt.Application.Features.Notifications.GetNotifications;

public class GetNotificationsQueryHandler
    : IRequestHandler<GetNotificationsQuery, GetNotificationsResponse>
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IQueryableExecutor _queryableExecutor;

    public GetNotificationsQueryHandler(
        INotificationRepository notificationRepository,
        IServiceRequestRepository serviceRequestRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUser,
        IQueryableExecutor queryableExecutor
    )
    {
        _notificationRepository = notificationRepository;
        _serviceRequestRepository = serviceRequestRepository;
        _userRepository = userRepository;
        _currentUser = currentUser;
        _queryableExecutor = queryableExecutor;
    }

    public async Task<GetNotificationsResponse> Handle(
        GetNotificationsQuery request,
        CancellationToken cancellationToken
    )
    {
        var limit = Math.Clamp(
            request.Limit ?? GetNotificationsQuery.DefaultLimit,
            GetNotificationsQuery.MinLimit,
            GetNotificationsQuery.MaxLimit
        );
        var tenantId = _currentUser.TenantId;

        var notifications = _notificationRepository.GetByRecipient(_currentUser.UserId, tenantId);
        if (request.UnreadOnly)
            notifications = notifications.Where(n => n.ReadAt == null);

        var items = await _queryableExecutor.ToListAsync(
            notifications
                .OrderByDescending(n => n.CreatedAt)
                .ThenByDescending(n => n.Id)
                .Take(limit)
                .ToDto(
                    _serviceRequestRepository.GetByTenantId(tenantId),
                    _userRepository.GetByTenantId(tenantId)
                ),
            cancellationToken
        );

        return new GetNotificationsResponse(items);
    }
}
