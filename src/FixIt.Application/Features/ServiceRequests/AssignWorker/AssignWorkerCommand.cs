using MediatR;

namespace FixIt.Application.Features.ServiceRequests.AssignWorker;

public record AssignWorkerCommand(Guid ServiceRequestId, Guid WorkerId)
    : IRequest<AssignWorkerResponse>;
