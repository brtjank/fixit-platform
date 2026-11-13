using FixIt.Domain.Entities;

namespace FixIt.Application.Features.Workers.GetWorkerProfiles;

public record GetWorkerProfilesResponse(IEnumerable<WorkerProfile> Profiles);
