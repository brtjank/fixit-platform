namespace FixIt.Application.Features.Login;

public record LoginResponse(string Token, Guid UserId, Guid TenantId, string Role);
