using FixIt.Domain.Enums;

namespace FixIt.Application.Features.Users.GetCurrentUser;

public record GetCurrentUserResponse(
    Guid Id,
    Guid TenantId,
    string Email,
    string FirstName,
    string LastName,
    UserRole Role,
    bool IsActive,
    DateTime CreatedAt,
    bool IsDeleted,
    string TenantName
);
