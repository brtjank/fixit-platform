using FixIt.Application.Features.Notifications.Common;
using MediatR;

namespace FixIt.Application.Features.Notifications.MarkNotificationRead;

public record MarkNotificationReadCommand(Guid NotificationId) : IRequest<NotificationDto>;
