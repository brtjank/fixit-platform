using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace FixIt.Infrastructure.Services;

/// <summary>
/// Wraps ASP.NET Core Identity's PBKDF2 hasher so the Application layer stays free of Identity types.
/// </summary>
public class PasswordHasherService : IPasswordHasher
{
    private readonly PasswordHasher<User> _hasher = new();

    // PasswordHasher<TUser> ignores the user argument in its default implementation,
    // which is why hashes can be produced before (or without) a User instance
    public string Hash(string password) => _hasher.HashPassword(null!, password);

    public bool Verify(string passwordHash, string password)
    {
        var result = _hasher.VerifyHashedPassword(null!, passwordHash, password);

        // SuccessRehashNeeded still means the password is correct; rehashing on login is not implemented yet
        return result is PasswordVerificationResult.Success
            or PasswordVerificationResult.SuccessRehashNeeded;
    }
}
