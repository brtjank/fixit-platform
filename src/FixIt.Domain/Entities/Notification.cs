using FixIt.Domain.Enums;

namespace FixIt.Domain.Entities;

/// <summary>
/// In-app notification for one recipient. Only structured data is stored: clients render the
/// (translated) text from <see cref="Type"/> and the statuses.
/// </summary>
public class Notification : BaseEntity
{
    public Guid RecipientUserId { get; private set; }
    public string Type { get; private set; } = string.Empty;
    public Guid? ServiceRequestId { get; private set; }
    public ServiceRequestStatus? PreviousStatus { get; private set; }
    public ServiceRequestStatus? NewStatus { get; private set; }
    public Guid? ActorUserId { get; private set; }

    // Event that produced this notification; unique together with the recipient so that
    // redelivered messages cannot create duplicates
    public Guid SourceEventId { get; private set; }
    public DateTime? ReadAt { get; private set; }

    public bool IsRead => ReadAt.HasValue;

    private Notification() { }

    public Notification(
        Guid tenantId,
        Guid recipientUserId,
        string type,
        Guid sourceEventId,
        Guid? serviceRequestId = null,
        ServiceRequestStatus? previousStatus = null,
        ServiceRequestStatus? newStatus = null,
        Guid? actorUserId = null
    )
        : base(tenantId)
    {
        if (string.IsNullOrWhiteSpace(type))
            throw new ArgumentException("Notification type is required.", nameof(type));

        RecipientUserId = recipientUserId;
        Type = type;
        SourceEventId = sourceEventId;
        ServiceRequestId = serviceRequestId;
        PreviousStatus = previousStatus;
        NewStatus = newStatus;
        ActorUserId = actorUserId;
    }

    /// <summary>Idempotent: the first read time is kept.</summary>
    public void MarkRead(DateTime readAtUtc)
    {
        ReadAt ??= readAtUtc;
    }
}
