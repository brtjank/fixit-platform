using FixIt.Domain.Enums;

namespace FixIt.Application.Features.CreateServiceRequest;

public record CreateServiceRequestResponse(
    Guid Id,
    string Title,
    string Description,
    Guid CustomerId,
    ServiceRequestStatus Status,
    DateTime CreatedAt
);
