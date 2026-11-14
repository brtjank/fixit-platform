using FixIt.Application.Interfaces.Repositories;
using FixIt.Domain.Entities;
using Moq;

namespace FixIt.Application.Tests.Common.Fakes;

/// <summary>
/// In-memory rows behind repository mocks that behave like the real ones: scoped by tenant and
/// hiding soft-deleted rows. Rows can be added after the handler is constructed because the
/// mocks read the lists on every call.
/// </summary>
public class InMemoryTenantData
{
    public List<User> Users { get; } = [];
    public List<ServiceRequest> Requests { get; } = [];
    public List<ServiceLog> Logs { get; } = [];
    public List<WorkerProfile> Profiles { get; } = [];
    public List<Notification> Notifications { get; } = [];

    public Mock<IUserRepository> UserRepository { get; } = new();
    public Mock<IServiceRequestRepository> ServiceRequestRepository { get; } = new();
    public Mock<IServiceLogRepository> ServiceLogRepository { get; } = new();
    public Mock<IWorkerProfileRepository> WorkerProfileRepository { get; } = new();
    public Mock<INotificationRepository> NotificationRepository { get; } = new();

    public InMemoryTenantData()
    {
        UserRepository
            .Setup(x => x.GetByTenantId(It.IsAny<Guid>()))
            .Returns((Guid tenantId) => Scoped(Users, tenantId));
        ServiceRequestRepository
            .Setup(x => x.GetByTenantId(It.IsAny<Guid>()))
            .Returns((Guid tenantId) => Scoped(Requests, tenantId));
        ServiceLogRepository
            .Setup(x => x.GetByTenantId(It.IsAny<Guid>()))
            .Returns((Guid tenantId) => Scoped(Logs, tenantId));
        WorkerProfileRepository
            .Setup(x => x.GetByTenantId(It.IsAny<Guid>()))
            .Returns((Guid tenantId) => Scoped(Profiles, tenantId));
        ServiceRequestRepository
            .Setup(x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (Guid id, Guid tenantId, CancellationToken _) =>
                    Scoped(Requests, tenantId).FirstOrDefault(r => r.Id == id)
            );
        NotificationRepository
            .Setup(x => x.GetByRecipient(It.IsAny<Guid>(), It.IsAny<Guid>()))
            .Returns(
                (Guid recipientId, Guid tenantId) =>
                    Scoped(Notifications, tenantId).Where(n => n.RecipientUserId == recipientId)
            );
        NotificationRepository
            .Setup(x => x.GetBySourceEventId(It.IsAny<Guid>(), It.IsAny<Guid>()))
            .Returns(
                (Guid eventId, Guid tenantId) =>
                    Scoped(Notifications, tenantId).Where(n => n.SourceEventId == eventId)
            );
        NotificationRepository
            .Setup(x =>
                x.GetByIdAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(
                (Guid id, Guid recipientId, Guid tenantId, CancellationToken _) =>
                    Scoped(Notifications, tenantId)
                        .FirstOrDefault(n => n.Id == id && n.RecipientUserId == recipientId)
            );
        NotificationRepository
            .Setup(x =>
                x.AddRangeAsync(It.IsAny<IEnumerable<Notification>>(), It.IsAny<CancellationToken>())
            )
            .Callback((IEnumerable<Notification> rows, CancellationToken _) => Notifications.AddRange(rows))
            .Returns(Task.CompletedTask);
        NotificationRepository
            .Setup(x =>
                x.MarkAllReadAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<DateTime>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(
                (Guid recipientId, Guid tenantId, DateTime readAt, CancellationToken _) =>
                {
                    var unread = Scoped(Notifications, tenantId)
                        .Where(n => n.RecipientUserId == recipientId && n.ReadAt == null)
                        .ToList();
                    unread.ForEach(n => n.MarkRead(readAt));
                    return unread.Count;
                }
            );
    }

    private static IQueryable<T> Scoped<T>(List<T> rows, Guid tenantId)
        where T : BaseEntity => rows.Where(r => r.TenantId == tenantId && !r.IsDeleted).AsQueryable();
}
