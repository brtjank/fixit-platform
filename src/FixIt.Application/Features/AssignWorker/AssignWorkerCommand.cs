using MediatR;

namespace FixIt.Application.Features.AssignWorker;

public record AssignWorkerCommand(Guid TenantId, Guid ServiceRequestId, Guid WorkerId)
    : IRequest<AssignWorkerResponse>;
