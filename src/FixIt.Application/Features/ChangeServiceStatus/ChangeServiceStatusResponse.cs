using FixIt.Domain.Enums;

namespace FixIt.Application.Features.ChangeServiceStatus;

public record ChangeServiceStatusResponse(Guid ServiceRequestId, ServiceRequestStatus Status);
