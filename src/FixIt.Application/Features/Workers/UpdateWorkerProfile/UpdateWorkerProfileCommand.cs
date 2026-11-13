using MediatR;

namespace FixIt.Application.Features.Workers.UpdateWorkerProfile;

public record UpdateWorkerProfileCommand(
    Guid UserId,
    string? Specialization,
    string? PhoneNumber,
    bool IsAvailable
) : IRequest<UpdateWorkerProfileResponse>;
