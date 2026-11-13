using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Constants;

namespace FixIt.Application.Common;

public static class PasswordHasherExtensions
{
    /// <summary>
    /// Enforces <see cref="PasswordPolicy"/> before hashing so no command can store a password
    /// that bypasses the policy.
    /// </summary>
    public static string HashValidPassword(this IPasswordHasher hasher, string? password)
    {
        PasswordPolicy.EnsureValid(password);
        return hasher.Hash(password!);
    }
}
