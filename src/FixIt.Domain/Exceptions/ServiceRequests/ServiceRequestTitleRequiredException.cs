namespace FixIt.Domain.Exceptions;

public class ServiceRequestTitleRequiredException : BadRequestException
{
    public ServiceRequestTitleRequiredException()
        : base(
            errorCode: "SR_004_TITLE_REQUIRED",
            message: "Service request title is required and cannot be empty."
        ) { }
}
