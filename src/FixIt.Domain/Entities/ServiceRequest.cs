using FixIt.Domain.Enums;
using FixIt.Domain.Events;
using FixIt.Domain.Exceptions;

namespace FixIt.Domain.Entities;

public class ServiceRequest : BaseEntity
{
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public Guid CustomerId { get; private set; }
    public Guid? AssignedWorkerId { get; private set; }
    public ServiceRequestStatus Status { get; private set; } = ServiceRequestStatus.Pending;
    public string? Notes { get; private set; }

    private ServiceRequest() { }

    public ServiceRequest(Guid tenantId, string title, string description, Guid customerId)
        : base(tenantId)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ServiceRequestTitleRequiredException();
        if (string.IsNullOrWhiteSpace(description))
            throw new ServiceRequestDescriptionRequiredException();

        Title = title;
        Description = description;
        CustomerId = customerId;
    }

    /// <param name="changedByUserId">Actor recorded on the raised event (null for system changes).</param>
    public void AssignWorker(Guid workerId, Guid? changedByUserId = null)
    {
        if (Status != ServiceRequestStatus.Pending)
            throw new ServiceRequestStatusInvalidForAssignmentException(Id, Status);

        AssignedWorkerId = workerId;
        SetStatus(ServiceRequestStatus.Assigned, changedByUserId);
    }

    /// <param name="changedByUserId">Actor recorded on the raised event (null for system changes).</param>
    public void ChangeStatus(ServiceRequestStatus newStatus, Guid? changedByUserId = null)
    {
        if (Status == ServiceRequestStatus.Completed || Status == ServiceRequestStatus.Cancelled)
            throw new ServiceRequestStatusImmutableException(Id, Status);

        if (newStatus == ServiceRequestStatus.InProgress && AssignedWorkerId == null)
            throw new ServiceRequestWorkerRequiredException(Id);

        SetStatus(newStatus, changedByUserId);
    }

    public void AddNotes(string notes)
    {
        Notes = notes;
    }

    public void UpdateNotes(string notes)
    {
        Notes = notes;
    }

    private void SetStatus(ServiceRequestStatus newStatus, Guid? changedByUserId)
    {
        // Re-applying the current status is a no-op and must not notify anyone
        if (Status == newStatus)
            return;

        var previousStatus = Status;
        Status = newStatus;

        Raise(
            new ServiceRequestStatusChanged(
                EventId: Guid.NewGuid(),
                OccurredAt: DateTime.UtcNow,
                TenantId: TenantId,
                ServiceRequestId: Id,
                PreviousStatus: previousStatus,
                NewStatus: newStatus,
                ChangedByUserId: changedByUserId
            )
        );
    }
}
