using MediatR;

namespace FixIt.Application.Features.Workers.GetWorkerProfile;

public record GetWorkerProfileQuery(Guid UserId) : IRequest<GetWorkerProfileResponse>;
