using MediatR;

namespace FixIt.Application.Features.AssignWorker;

public record AssignWorkerCommand(Guid ServiceRequestId, Guid WorkerId)
    : IRequest<AssignWorkerResponse>;
