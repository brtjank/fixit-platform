namespace FixIt.Application.Features.ServiceRequests.CreateServiceRequest;

public record CreateServiceRequestRequest(string Title, string Description, Guid CustomerId);
