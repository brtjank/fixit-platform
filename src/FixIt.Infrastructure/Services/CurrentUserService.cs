using System.Security.Claims;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Exceptions;
using Microsoft.AspNetCore.Http;

namespace FixIt.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid UserId
    {
        get
        {
            if (!IsAuthenticated)
                throw new UserNotAuthenticatedException();

            var userIdClaim =
                _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)
                ?? _httpContextAccessor.HttpContext?.User?.FindFirst("sub");

            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                throw new InvalidClaimException("UserId", "missing or invalid");

            return userId;
        }
    }

    public Guid TenantId
    {
        get
        {
            if (!IsAuthenticated)
                throw new UserNotAuthenticatedException();

            var tenantIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("TenantId");

            if (tenantIdClaim == null || !Guid.TryParse(tenantIdClaim.Value, out var tenantId))
                throw new InvalidClaimException("TenantId", "missing or invalid");

            return tenantId;
        }
    }

    public string Role
    {
        get
        {
            var roleClaim =
                _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)
                ?? _httpContextAccessor.HttpContext?.User?.FindFirst("role");

            return roleClaim?.Value ?? string.Empty;
        }
    }

    public bool IsAuthenticated =>
        _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}
