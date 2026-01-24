using FixIt.Domain.Enums;

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
            throw new ArgumentException("Title cannot be null or empty.", nameof(title));
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException(
                "Description cannot be null or empty.",
                nameof(description)
            );

        Title = title;
        Description = description;
        CustomerId = customerId;
    }

    public void AssignWorker(Guid workerId)
    {
        if (Status != ServiceRequestStatus.Pending)
            throw new InvalidOperationException(
                $"Cannot assign worker to service request with status {Status}."
            );

        AssignedWorkerId = workerId;
        Status = ServiceRequestStatus.Assigned;
    }

    public void ChangeStatus(ServiceRequestStatus newStatus)
    {
        if (Status == ServiceRequestStatus.Completed || Status == ServiceRequestStatus.Cancelled)
            throw new InvalidOperationException(
                $"Cannot change status of {Status} service request."
            );

        if (newStatus == ServiceRequestStatus.InProgress && AssignedWorkerId == null)
            throw new InvalidOperationException(
                "Cannot set status to InProgress without assigned worker."
            );

        Status = newStatus;
    }

    public void AddNotes(string notes)
    {
        Notes = notes;
    }

    public void UpdateNotes(string notes)
    {
        Notes = notes;
    }
}
