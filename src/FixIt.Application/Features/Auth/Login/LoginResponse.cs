namespace FixIt.Application.Features.Auth.Login;

public record LoginResponse(string Token, Guid UserId, Guid TenantId, string Role);
