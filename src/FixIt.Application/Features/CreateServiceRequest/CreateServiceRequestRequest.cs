namespace FixIt.Application.Features.CreateServiceRequest;

public record CreateServiceRequestRequest(string Title, string Description, Guid CustomerId);
