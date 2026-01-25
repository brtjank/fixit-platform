namespace FixIt.Domain.Exceptions;

public class ServiceRequestDescriptionRequiredException : BadRequestException
{
    public ServiceRequestDescriptionRequiredException()
        : base(
            errorCode: "SR_005_DESCRIPTION_REQUIRED",
            message: "Service request description is required and cannot be empty."
        ) { }
}
