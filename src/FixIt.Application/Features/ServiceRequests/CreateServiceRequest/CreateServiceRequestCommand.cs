using MediatR;

namespace FixIt.Application.Features.ServiceRequests.CreateServiceRequest;

public record CreateServiceRequestCommand(string Title, string Description, Guid CustomerId)
    : IRequest<CreateServiceRequestResponse>;
