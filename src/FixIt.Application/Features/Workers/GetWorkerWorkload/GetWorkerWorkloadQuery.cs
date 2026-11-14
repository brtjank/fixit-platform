using MediatR;

namespace FixIt.Application.Features.Workers.GetWorkerWorkload;

public record GetWorkerWorkloadQuery : IRequest<GetWorkerWorkloadResponse>;
