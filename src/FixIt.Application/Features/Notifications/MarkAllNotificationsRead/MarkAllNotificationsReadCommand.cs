using MediatR;

namespace FixIt.Application.Features.Notifications.MarkAllNotificationsRead;

public record MarkAllNotificationsReadCommand : IRequest<MarkAllNotificationsReadResponse>;
