using FixIt.Application.Interfaces.Services;
using Moq;

namespace FixIt.Application.Tests.Common.Fakes;

/// <summary>
/// Deterministic stand-in for the PBKDF2 hasher: "hashed:" + password, verified by string comparison.
/// </summary>
public static class PasswordHasherMock
{
    public static string HashOf(string password) => $"hashed:{password}";

    public static Mock<IPasswordHasher> Create()
    {
        var mock = new Mock<IPasswordHasher>();
        mock.Setup(x => x.Hash(It.IsAny<string>())).Returns((string p) => HashOf(p));
        mock.Setup(x => x.Verify(It.IsAny<string>(), It.IsAny<string>()))
            .Returns((string hash, string password) => hash == HashOf(password));
        return mock;
    }
}
