using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Xunit;

namespace FixIt.Domain.Tests.Entities;

public class UserSoftDeleteTests
{
    [Fact]
    public void SoftDelete_ActiveUser_DeactivatesAndMarksAsDeleted()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var user = new User(tenantId, "test@example.com", "John", "Doe", UserRole.Customer);
        user.IsActive.Should().BeTrue();
        user.IsDeleted.Should().BeFalse();

        // Act
        user.SoftDelete();

        // Assert
        user.IsDeleted.Should().BeTrue();
        user.IsActive.Should().BeFalse();
    }

    [Fact]
    public void SoftDelete_InactiveUser_MarksAsDeleted()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var user = new User(tenantId, "test@example.com", "John", "Doe", UserRole.Customer);
        user.Deactivate();

        // Act
        user.SoftDelete();

        // Assert
        user.IsDeleted.Should().BeTrue();
        user.IsActive.Should().BeFalse();
    }

    [Fact]
    public void Activate_DeletedUser_ThrowsUserCannotBeActivatedException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var user = new User(tenantId, "test@example.com", "John", "Doe", UserRole.Customer);
        user.SoftDelete();

        // Act
        var act = () => user.Activate();

        // Assert
        var exception = act.Should().Throw<UserCannotBeActivatedException>().Which;
        exception.UserId.Should().Be(user.Id);
    }

    [Fact]
    public void SoftDelete_ThenActivate_ThrowsUserCannotBeActivatedException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var user = new User(tenantId, "test@example.com", "John", "Doe", UserRole.Customer);
        user.SoftDelete();

        // Act & Assert
        var act = () => user.Activate();
        act.Should().Throw<UserCannotBeActivatedException>();

        user.IsDeleted.Should().BeTrue();
        user.IsActive.Should().BeFalse();
    }
}
