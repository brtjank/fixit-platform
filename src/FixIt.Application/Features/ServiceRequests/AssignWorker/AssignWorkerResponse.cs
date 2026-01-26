using FixIt.Domain.Enums;

namespace FixIt.Application.Features.ServiceRequests.AssignWorker;

public record AssignWorkerResponse(
    Guid ServiceRequestId,
    Guid? AssignedWorkerId,
    ServiceRequestStatus Status
);
