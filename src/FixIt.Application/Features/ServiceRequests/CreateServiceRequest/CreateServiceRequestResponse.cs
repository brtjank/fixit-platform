using FixIt.Domain.Enums;

namespace FixIt.Application.Features.ServiceRequests.CreateServiceRequest;

public record CreateServiceRequestResponse(
    Guid Id,
    string Title,
    string Description,
    Guid CustomerId,
    ServiceRequestStatus Status,
    DateTime CreatedAt
);
