namespace FixIt.Application.Features.ServiceRequests.AssignWorker;

public record AssignWorkerRequest(Guid ServiceRequestId, Guid WorkerId);
