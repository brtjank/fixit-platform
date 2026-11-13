namespace FixIt.Application.Features.Workers.UpdateWorkerProfile;

public record UpdateWorkerProfileRequest(
    string? Specialization,
    string? PhoneNumber,
    bool IsAvailable
);
