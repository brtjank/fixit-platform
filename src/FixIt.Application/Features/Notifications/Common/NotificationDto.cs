using FixIt.Domain.Enums;

namespace FixIt.Application.Features.Notifications.Common;

/// <summary>
/// Notification as returned by the API. No display text: clients translate it from
/// <see cref="Type"/> and the statuses.
/// </summary>
/// <param name="ServiceRequestTitle">Null when the request no longer exists.</param>
/// <param name="ActorName">"First Last" of whoever caused the change; null for system changes or deleted users.</param>
public record NotificationDto(
    Guid Id,
    string Type,
    Guid? ServiceRequestId,
    string? ServiceRequestTitle,
    ServiceRequestStatus? PreviousStatus,
    ServiceRequestStatus? NewStatus,
    string? ActorName,
    DateTime CreatedAt,
    DateTime? ReadAt
);
