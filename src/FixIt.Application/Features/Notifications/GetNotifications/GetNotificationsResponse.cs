using FixIt.Application.Features.Notifications.Common;

namespace FixIt.Application.Features.Notifications.GetNotifications;

public record GetNotificationsResponse(IReadOnlyList<NotificationDto> Items);
