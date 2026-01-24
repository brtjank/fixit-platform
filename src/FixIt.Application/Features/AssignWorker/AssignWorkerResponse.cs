using FixIt.Domain.Enums;

namespace FixIt.Application.Features.AssignWorker;

public record AssignWorkerResponse(
    Guid ServiceRequestId,
    Guid? AssignedWorkerId,
    ServiceRequestStatus Status
);
