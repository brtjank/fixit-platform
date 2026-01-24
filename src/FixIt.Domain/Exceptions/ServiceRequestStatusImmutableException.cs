using FixIt.Domain.Enums;

namespace FixIt.Domain.Exceptions;

public class ServiceRequestStatusImmutableException : BadRequestException
{
    public Guid ServiceRequestId { get; }
    public ServiceRequestStatus CurrentStatus { get; }

    public ServiceRequestStatusImmutableException(
        Guid serviceRequestId,
        ServiceRequestStatus currentStatus
    )
        : base(
            $"Cannot change status of service request {serviceRequestId}. Status {currentStatus} is immutable (Completed or Cancelled)."
        )
    {
        ServiceRequestId = serviceRequestId;
        CurrentStatus = currentStatus;
    }
}
