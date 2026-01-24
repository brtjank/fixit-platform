namespace FixIt.Application.Features.AssignWorker;

public record AssignWorkerRequest(Guid ServiceRequestId, Guid WorkerId);
