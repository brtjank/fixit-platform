using FixIt.Application.Interfaces.Repositories;
using FixIt.Domain.Entities;
using FixIt.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FixIt.Infrastructure.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly FixItDbContext _context;

    public NotificationRepository(FixItDbContext context)
    {
        _context = context;
    }

    public IQueryable<Notification> GetByRecipient(Guid recipientUserId, Guid tenantId)
    {
        return _context.Notifications.Where(n =>
            n.RecipientUserId == recipientUserId && n.TenantId == tenantId
        );
    }

    public IQueryable<Notification> GetBySourceEventId(Guid sourceEventId, Guid tenantId)
    {
        return _context.Notifications.Where(n =>
            n.SourceEventId == sourceEventId && n.TenantId == tenantId
        );
    }

    public async Task<Notification?> GetByIdAsync(
        Guid id,
        Guid recipientUserId,
        Guid tenantId,
        CancellationToken cancellationToken = default
    )
    {
        return await GetByRecipient(recipientUserId, tenantId)
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
    }

    public async Task AddRangeAsync(
        IEnumerable<Notification> notifications,
        CancellationToken cancellationToken = default
    )
    {
        await _context.Notifications.AddRangeAsync(notifications, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(
        Notification notification,
        CancellationToken cancellationToken = default
    )
    {
        _context.Notifications.Update(notification);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<int> MarkAllReadAsync(
        Guid recipientUserId,
        Guid tenantId,
        DateTime readAtUtc,
        CancellationToken cancellationToken = default
    )
    {
        return await GetByRecipient(recipientUserId, tenantId)
            .Where(n => n.ReadAt == null)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(n => n.ReadAt, readAtUtc),
                cancellationToken
            );
    }
}
