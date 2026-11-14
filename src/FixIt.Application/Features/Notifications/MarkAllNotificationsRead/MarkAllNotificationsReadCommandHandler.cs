using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using MediatR;

namespace FixIt.Application.Features.Notifications.MarkAllNotificationsRead;

public class MarkAllNotificationsReadCommandHandler
    : IRequestHandler<MarkAllNotificationsReadCommand, MarkAllNotificationsReadResponse>
{
    private readonly INotificationRepository _notificationRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeProvider _dateTimeProvider;

    public MarkAllNotificationsReadCommandHandler(
        INotificationRepository notificationRepository,
        ICurrentUserService currentUser,
        IDateTimeProvider dateTimeProvider
    )
    {
        _notificationRepository = notificationRepository;
        _currentUser = currentUser;
        _dateTimeProvider = dateTimeProvider;
    }

    public async Task<MarkAllNotificationsReadResponse> Handle(
        MarkAllNotificationsReadCommand request,
        CancellationToken cancellationToken
    )
    {
        var updated = await _notificationRepository.MarkAllReadAsync(
            _currentUser.UserId,
            _currentUser.TenantId,
            _dateTimeProvider.UtcNow,
            cancellationToken
        );

        return new MarkAllNotificationsReadResponse(updated);
    }
}
