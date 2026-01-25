namespace FixIt.Domain.Exceptions;

public class ServiceRequestWorkerRequiredException : BadRequestException
{
    public Guid ServiceRequestId { get; }

    public ServiceRequestWorkerRequiredException(Guid serviceRequestId)
        : base(
            errorCode: "SR_003_WORKER_REQUIRED",
            message: $"Cannot set service request {serviceRequestId} status to InProgress without assigned worker."
        )
    {
        ServiceRequestId = serviceRequestId;
    }
}
