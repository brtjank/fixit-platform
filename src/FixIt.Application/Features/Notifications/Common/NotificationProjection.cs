using FixIt.Domain.Entities;

namespace FixIt.Application.Features.Notifications.Common;

public static class NotificationProjection
{
    /// <summary>
    /// Projects notifications to DTOs in the database. Title and actor are correlated subqueries
    /// (left-join semantics), so a soft-deleted request or user yields null instead of hiding the row.
    /// </summary>
    public static IQueryable<NotificationDto> ToDto(
        this IQueryable<Notification> notifications,
        IQueryable<ServiceRequest> requests,
        IQueryable<User> users
    ) =>
        notifications.Select(n => new NotificationDto(
            n.Id,
            n.Type,
            n.ServiceRequestId,
            requests.Where(r => r.Id == n.ServiceRequestId).Select(r => r.Title).FirstOrDefault(),
            n.PreviousStatus,
            n.NewStatus,
            users
                .Where(u => u.Id == n.ActorUserId)
                .Select(u => u.FirstName + " " + u.LastName)
                .FirstOrDefault(),
            n.CreatedAt,
            n.ReadAt
        ));
}
