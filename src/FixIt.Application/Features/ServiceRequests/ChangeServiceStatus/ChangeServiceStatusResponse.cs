using FixIt.Domain.Enums;

namespace FixIt.Application.Features.ServiceRequests.ChangeServiceStatus;

public record ChangeServiceStatusResponse(Guid ServiceRequestId, ServiceRequestStatus Status);
