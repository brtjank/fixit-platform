namespace FixIt.Domain.Exceptions;

public class ServiceRequestDescriptionRequiredException : BadRequestException
{
    public ServiceRequestDescriptionRequiredException()
        : base("Service request description is required and cannot be empty.") { }
}
