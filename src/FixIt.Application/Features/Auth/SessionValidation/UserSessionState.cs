namespace FixIt.Application.Features.Auth.SessionValidation;

/// <summary>
/// Minimal projection of a user needed to validate a session on each request.
/// </summary>
public record UserSessionState(
    Guid Id,
    Guid TenantId,
    bool IsActive,
    bool IsDeleted,
    int TokenVersion
);
