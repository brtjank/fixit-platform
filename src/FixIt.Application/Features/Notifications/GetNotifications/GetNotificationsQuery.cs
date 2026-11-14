using MediatR;

namespace FixIt.Application.Features.Notifications.GetNotifications;

/// <param name="Limit">Clamped to <see cref="MinLimit"/>..<see cref="MaxLimit"/>; null means <see cref="DefaultLimit"/>.</param>
public record GetNotificationsQuery(bool UnreadOnly = false, int? Limit = null)
    : IRequest<GetNotificationsResponse>
{
    public const int DefaultLimit = 20;
    public const int MinLimit = 1;
    public const int MaxLimit = 100;
}
