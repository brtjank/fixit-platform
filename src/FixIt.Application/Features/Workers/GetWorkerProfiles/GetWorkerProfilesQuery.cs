using MediatR;

namespace FixIt.Application.Features.Workers.GetWorkerProfiles;

public record GetWorkerProfilesQuery : IRequest<GetWorkerProfilesResponse>;
