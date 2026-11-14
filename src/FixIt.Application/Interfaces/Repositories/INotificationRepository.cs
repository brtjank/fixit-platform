using FixIt.Domain.Entities;

namespace FixIt.Application.Interfaces.Repositories;

public interface INotificationRepository
{
    IQueryable<Notification> GetByRecipient(Guid recipientUserId, Guid tenantId);
    IQueryable<Notification> GetBySourceEventId(Guid sourceEventId, Guid tenantId);
    Task<Notification?> GetByIdAsync(
        Guid id,
        Guid recipientUserId,
        Guid tenantId,
        CancellationToken cancellationToken = default
    );
    Task AddRangeAsync(
        IEnumerable<Notification> notifications,
        CancellationToken cancellationToken = default
    );
    Task UpdateAsync(Notification notification, CancellationToken cancellationToken = default);

    /// <summary>Marks every unread notification of the recipient as read in one statement.</summary>
    /// <returns>Number of notifications updated.</returns>
    Task<int> MarkAllReadAsync(
        Guid recipientUserId,
        Guid tenantId,
        DateTime readAtUtc,
        CancellationToken cancellationToken = default
    );
}
