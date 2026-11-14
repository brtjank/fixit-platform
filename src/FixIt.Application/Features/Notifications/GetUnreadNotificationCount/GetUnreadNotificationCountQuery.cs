using MediatR;

namespace FixIt.Application.Features.Notifications.GetUnreadNotificationCount;

public record GetUnreadNotificationCountQuery : IRequest<GetUnreadNotificationCountResponse>;
