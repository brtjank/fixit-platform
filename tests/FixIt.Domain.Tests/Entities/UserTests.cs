using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace FixIt.Domain.Tests.Entities;

public class UserTests
{
    [Fact]
    public void Constructor_ValidParameters_CreatesUser()
    {
        // Arrange
        var tenantId = Guid.NewGuid();

        // Act
        var user = new User(tenantId, "test@example.com", "John", "Doe", UserRole.Customer);

        // Assert
        user.Should().NotBeNull();
        user.TenantId.Should().Be(tenantId);
        user.Email.Should().Be("test@example.com");
        user.FirstName.Should().Be("John");
        user.LastName.Should().Be("Doe");
        user.Role.Should().Be(UserRole.Customer);
        user.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Deactivate_SetsIsActiveToFalse()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var user = new User(tenantId, "test@example.com", "John", "Doe", UserRole.Customer);

        // Act
        user.Deactivate();

        // Assert
        user.IsActive.Should().BeFalse();
    }

    [Fact]
    public void Activate_SetsIsActiveToTrue()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var user = new User(tenantId, "test@example.com", "John", "Doe", UserRole.Customer);
        user.Deactivate();

        // Act
        user.Activate();

        // Assert
        user.IsActive.Should().BeTrue();
    }

    [Fact]
    public void ChangeRole_UpdatesRole()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var user = new User(tenantId, "test@example.com", "John", "Doe", UserRole.Customer);

        // Act
        user.ChangeRole(UserRole.Worker);

        // Assert
        user.Role.Should().Be(UserRole.Worker);
    }

    [Fact]
    public void SoftDelete_MarksAsDeleted()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var user = new User(tenantId, "test@example.com", "John", "Doe", UserRole.Customer);

        // Act
        user.SoftDelete();

        // Assert
        user.IsDeleted.Should().BeTrue();
    }
}
