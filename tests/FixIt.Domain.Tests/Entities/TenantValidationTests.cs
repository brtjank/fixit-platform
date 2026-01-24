using FixIt.Domain.Entities;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Xunit;

namespace FixIt.Domain.Tests.Entities;

public class TenantValidationTests
{
    [Fact]
    public void UpdateName_EmptyName_ThrowsTenantNameRequiredException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var tenant = new Tenant(tenantId, "Test Company");

        // Act
        var act = () => tenant.UpdateName(string.Empty);

        // Assert
        act.Should().Throw<TenantNameRequiredException>();
    }

    [Fact]
    public void UpdateName_WhitespaceName_ThrowsTenantNameRequiredException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var tenant = new Tenant(tenantId, "Test Company");

        // Act
        var act = () => tenant.UpdateName("   ");

        // Assert
        act.Should().Throw<TenantNameRequiredException>();
    }
}
