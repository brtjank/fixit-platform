using FixIt.Domain.Enums;
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

    public void AssignWorker(Guid workerId)
    {
        if (Status != ServiceRequestStatus.Pending)
            throw new ServiceRequestStatusInvalidForAssignmentException(Id, Status);

        AssignedWorkerId = workerId;
        Status = ServiceRequestStatus.Assigned;
    }

    public void ChangeStatus(ServiceRequestStatus newStatus)
    {
        if (Status == ServiceRequestStatus.Completed || Status == ServiceRequestStatus.Cancelled)
            throw new ServiceRequestStatusImmutableException(Id, Status);

        if (newStatus == ServiceRequestStatus.InProgress && AssignedWorkerId == null)
            throw new ServiceRequestWorkerRequiredException(Id);

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
