using FixIt.Application.Features.Notifications.Common;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.Notifications.MarkNotificationRead;

public class MarkNotificationReadCommandHandler
    : IRequestHandler<MarkNotificationReadCommand, NotificationDto>
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IQueryableExecutor _queryableExecutor;
    private readonly IDateTimeProvider _dateTimeProvider;

    public MarkNotificationReadCommandHandler(
        INotificationRepository notificationRepository,
        IServiceRequestRepository serviceRequestRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUser,
        IQueryableExecutor queryableExecutor,
        IDateTimeProvider dateTimeProvider
    )
    {
        _notificationRepository = notificationRepository;
        _serviceRequestRepository = serviceRequestRepository;
        _userRepository = userRepository;
        _currentUser = currentUser;
        _queryableExecutor = queryableExecutor;
        _dateTimeProvider = dateTimeProvider;
    }

    public async Task<NotificationDto> Handle(
        MarkNotificationReadCommand request,
        CancellationToken cancellationToken
    )
    {
        var tenantId = _currentUser.TenantId;
        var userId = _currentUser.UserId;

        // Scoped by recipient and tenant: someone else's notification is reported as missing
        var notification =
            await _notificationRepository.GetByIdAsync(
                request.NotificationId,
                userId,
                tenantId,
                cancellationToken
            )
            ?? throw new ResourceNotFoundException(
                "Notification",
                request.NotificationId.ToString()
            );

        if (!notification.IsRead)
        {
            notification.MarkRead(_dateTimeProvider.UtcNow);
            await _notificationRepository.UpdateAsync(notification, cancellationToken);
        }

        var dtos = await _queryableExecutor.ToListAsync(
            _notificationRepository
                .GetByRecipient(userId, tenantId)
                .Where(n => n.Id == notification.Id)
                .ToDto(
                    _serviceRequestRepository.GetByTenantId(tenantId),
                    _userRepository.GetByTenantId(tenantId)
                ),
            cancellationToken
        );

        return dtos.FirstOrDefault()
            ?? throw new ResourceNotFoundException(
                "Notification",
                request.NotificationId.ToString()
            );
    }
}
