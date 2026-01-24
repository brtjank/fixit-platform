using FixIt.Domain.Enums;

namespace FixIt.Application.Features.ChangeServiceStatus;

public record ChangeServiceStatusRequest(
    Guid ServiceRequestId,
    ServiceRequestStatus NewStatus,
    string? Notes = null
);
