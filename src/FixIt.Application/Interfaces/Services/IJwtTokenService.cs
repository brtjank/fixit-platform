using FixIt.Domain.Entities;

namespace FixIt.Application.Interfaces.Services;

public interface IJwtTokenService
{
    string GenerateToken(User user);
}
