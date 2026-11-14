using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace FixIt.Domain.Tests.Entities;

public class UserTokenVersionTests
{
    private static User NewUser(UserRole role = UserRole.Customer) =>
        new(Guid.NewGuid(), "test@example.com", "John", "Doe", role);

    [Fact]
    public void Constructor_StartsAtZero()
    {
        NewUser().TokenVersion.Should().Be(0);
    }

    [Fact]
    public void SetPasswordHash_BumpsTokenVersion()
    {
        // Arrange
        var user = NewUser();

        // Act
        user.SetPasswordHash("hash-1");
        user.SetPasswordHash("hash-2");

        // Assert
        user.TokenVersion.Should().Be(2);
    }

    [Fact]
    public void Deactivate_BumpsTokenVersion()
    {
        // Arrange
        var user = NewUser();

        // Act
        user.Deactivate();

        // Assert
        user.TokenVersion.Should().Be(1);
    }

    [Fact]
    public void SoftDelete_BumpsTokenVersion()
    {
        // Arrange
        var user = NewUser();

        // Act
        user.SoftDelete();

        // Assert
        user.TokenVersion.Should().Be(1);
    }

    [Fact]
    public void ChangeRole_DifferentRole_BumpsTokenVersion()
    {
        // Arrange
        var user = NewUser(UserRole.Customer);

        // Act
        user.ChangeRole(UserRole.Admin);

        // Assert
        user.Role.Should().Be(UserRole.Admin);
        user.TokenVersion.Should().Be(1);
    }

    [Fact]
    public void ChangeRole_SameRole_DoesNotBumpTokenVersion()
    {
        // Arrange
        var user = NewUser(UserRole.Worker);

        // Act
        user.ChangeRole(UserRole.Worker);

        // Assert
        user.TokenVersion.Should().Be(0);
    }

    [Fact]
    public void Activate_DoesNotBumpTokenVersion()
    {
        // Arrange
        var user = NewUser();
        user.Deactivate();

        // Act
        user.Activate();

        // Assert
        user.TokenVersion.Should().Be(1);
    }

    [Fact]
    public void UpdateName_DoesNotBumpTokenVersion()
    {
        // Arrange
        var user = NewUser();

        // Act
        user.UpdateName("Jane", "Roe");

        // Assert
        user.TokenVersion.Should().Be(0);
    }

    [Fact]
    public void TokenVersion_IsNotSerialised()
    {
        // Arrange
        var user = NewUser();
        user.Deactivate();

        // Act
        var json = System.Text.Json.JsonSerializer.Serialize(user);

        // Assert
        json.Should().NotContain("TokenVersion");
    }
}
