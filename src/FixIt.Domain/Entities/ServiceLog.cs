using FixIt.Domain.Enums;

namespace FixIt.Domain.Entities;

public class ServiceLog : BaseEntity
{
    public Guid ServiceRequestId { get; private set; }
    public ServiceRequestStatus PreviousStatus { get; private set; }
    public ServiceRequestStatus NewStatus { get; private set; }
    public string? Notes { get; private set; }
    public Guid? ChangedByUserId { get; private set; }

    private ServiceLog() { }

    public ServiceLog(
        Guid tenantId,
        Guid serviceRequestId,
        ServiceRequestStatus previousStatus,
        ServiceRequestStatus newStatus,
        string? notes = null,
        Guid? changedByUserId = null
    )
        : base(tenantId)
    {
        ServiceRequestId = serviceRequestId;
        PreviousStatus = previousStatus;
        NewStatus = newStatus;
        Notes = notes;
        ChangedByUserId = changedByUserId;
    }
}
