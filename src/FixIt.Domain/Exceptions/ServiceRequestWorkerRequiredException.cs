namespace FixIt.Domain.Exceptions;

public class ServiceRequestWorkerRequiredException : BadRequestException
{
    public Guid ServiceRequestId { get; }

    public ServiceRequestWorkerRequiredException(Guid serviceRequestId)
        : base(
            $"Cannot set service request {serviceRequestId} status to InProgress without assigned worker."
        )
    {
        ServiceRequestId = serviceRequestId;
    }
}
