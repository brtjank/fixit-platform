using FixIt.Domain.Enums;

namespace FixIt.Application.Features.ServiceRequests.ChangeServiceStatus;

public record ChangeServiceStatusRequest(
    Guid ServiceRequestId,
    ServiceRequestStatus NewStatus,
    string? Notes = null
);
