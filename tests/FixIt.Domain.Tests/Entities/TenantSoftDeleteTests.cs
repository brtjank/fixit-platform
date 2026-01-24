using FixIt.Domain.Entities;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Xunit;

namespace FixIt.Domain.Tests.Entities;

public class TenantSoftDeleteTests
{
    [Fact]
    public void SoftDelete_ActiveTenant_DeactivatesAndMarksAsDeleted()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var tenant = new Tenant(tenantId, "Test Company");
        tenant.IsActive.Should().BeTrue();
        tenant.IsDeleted.Should().BeFalse();

        // Act
        tenant.SoftDelete();

        // Assert
        tenant.IsDeleted.Should().BeTrue();
        tenant.IsActive.Should().BeFalse();
    }

    [Fact]
    public void SoftDelete_InactiveTenant_MarksAsDeleted()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var tenant = new Tenant(tenantId, "Test Company");
        tenant.Deactivate();

        // Act
        tenant.SoftDelete();

        // Assert
        tenant.IsDeleted.Should().BeTrue();
        tenant.IsActive.Should().BeFalse();
    }

    [Fact]
    public void Activate_DeletedTenant_ThrowsTenantCannotBeActivatedException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var tenant = new Tenant(tenantId, "Test Company");
        tenant.SoftDelete();

        // Act
        var act = () => tenant.Activate();

        // Assert
        var exception = act.Should().Throw<TenantCannotBeActivatedException>().Which;
        exception.TenantId.Should().Be(tenant.Id);
    }

    [Fact]
    public void SoftDelete_ThenActivate_ThrowsTenantCannotBeActivatedException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var tenant = new Tenant(tenantId, "Test Company");
        tenant.SoftDelete();

        // Act & Assert
        var act = () => tenant.Activate();
        act.Should().Throw<TenantCannotBeActivatedException>();

        tenant.IsDeleted.Should().BeTrue();
        tenant.IsActive.Should().BeFalse();
    }
}
