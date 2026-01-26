using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Infrastructure.Exceptions;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace FixIt.Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var secret =
            jwtSettings["Secret"]
            ?? throw new ConfigurationException("JWT Secret is not configured");
        var issuer = jwtSettings["Issuer"] ?? "FixIt.Platform";
        var audience = jwtSettings["Audience"] ?? "FixIt.Platform";
        var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "60");

        var key = Encoding.UTF8.GetBytes(secret);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(
                new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim("sub", user.Id.ToString()),
                    new Claim("TenantId", user.TenantId.ToString()),
                    new Claim(ClaimTypes.Role, user.Role.ToString()),
                    new Claim("role", user.Role.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                }
            ),
            Expires = DateTime.UtcNow.AddMinutes(expirationMinutes),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature
            ),
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
