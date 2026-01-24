namespace FixIt.Domain.Exceptions;

public class ServiceRequestTitleRequiredException : BadRequestException
{
    public ServiceRequestTitleRequiredException()
        : base("Service request title is required and cannot be empty.") { }
}
