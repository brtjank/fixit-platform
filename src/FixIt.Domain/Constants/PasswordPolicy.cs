using FixIt.Domain.Exceptions;

namespace FixIt.Domain.Constants;

/// <summary>
/// Single source of truth for password rules; every flow that sets a password goes through
/// <see cref="EnsureValid"/> so the limits cannot diverge between sign-up, change and reset.
/// </summary>
public static class PasswordPolicy
{
    public const int MinLength = 8;

    // Upper bound keeps PBKDF2 hashing cost bounded for attacker-supplied input
    public const int MaxLength = 128;

    public static bool IsValid(string? password) =>
        password is not null && password.Length is >= MinLength and <= MaxLength;

    public static void EnsureValid(string? password)
    {
        if (!IsValid(password))
            throw new UserPasswordTooWeakException(MinLength, MaxLength);
    }
}
