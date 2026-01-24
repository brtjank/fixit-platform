using FixIt.Domain.Enums;

namespace FixIt.Domain.Exceptions;

public class ServiceRequestStatusInvalidForAssignmentException : BadRequestException
{
    public Guid ServiceRequestId { get; }
    public ServiceRequestStatus CurrentStatus { get; }

    public ServiceRequestStatusInvalidForAssignmentException(
        Guid serviceRequestId,
        ServiceRequestStatus currentStatus
    )
        : base(
            $"Cannot assign worker to service request {serviceRequestId} with status {currentStatus}. Only Pending requests can have workers assigned."
        )
    {
        ServiceRequestId = serviceRequestId;
        CurrentStatus = currentStatus;
    }
}
