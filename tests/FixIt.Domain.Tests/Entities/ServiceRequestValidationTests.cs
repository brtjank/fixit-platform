using FixIt.Domain.Entities;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Xunit;

namespace FixIt.Domain.Tests.Entities;

public class ServiceRequestValidationTests
{
    [Fact]
    public void Constructor_EmptyTitle_ThrowsServiceRequestTitleRequiredException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();

        // Act
        var act = () => new ServiceRequest(tenantId, string.Empty, "Description", customerId);

        // Assert
        act.Should().Throw<ServiceRequestTitleRequiredException>();
    }

    [Fact]
    public void Constructor_WhitespaceTitle_ThrowsServiceRequestTitleRequiredException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();

        // Act
        var act = () => new ServiceRequest(tenantId, "   ", "Description", customerId);

        // Assert
        act.Should().Throw<ServiceRequestTitleRequiredException>();
    }

    [Fact]
    public void Constructor_EmptyDescription_ThrowsServiceRequestDescriptionRequiredException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();

        // Act
        var act = () => new ServiceRequest(tenantId, "Title", string.Empty, customerId);

        // Assert
        act.Should().Throw<ServiceRequestDescriptionRequiredException>();
    }

    [Fact]
    public void Constructor_WhitespaceDescription_ThrowsServiceRequestDescriptionRequiredException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();

        // Act
        var act = () => new ServiceRequest(tenantId, "Title", "   ", customerId);

        // Assert
        act.Should().Throw<ServiceRequestDescriptionRequiredException>();
    }
}
