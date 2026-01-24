using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
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
    public void Activate_DeletedUser_ThrowsInvalidOperationException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var user = new User(tenantId, "test@example.com", "John", "Doe", UserRole.Customer);
        user.SoftDelete();

        // Act
        var act = () => user.Activate();

        // Assert
        act.Should().Throw<InvalidOperationException>().WithMessage("*deleted*");
    }

    [Fact]
    public void SoftDelete_ThenActivate_ThrowsException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var user = new User(tenantId, "test@example.com", "John", "Doe", UserRole.Customer);
        user.SoftDelete();

        // Act & Assert
        var act = () => user.Activate();
        act.Should().Throw<InvalidOperationException>();

        user.IsDeleted.Should().BeTrue();
        user.IsActive.Should().BeFalse();
    }
}
