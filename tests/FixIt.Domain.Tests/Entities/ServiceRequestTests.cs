using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace FixIt.Domain.Tests.Entities;

public class ServiceRequestTests
{
    [Fact]
    public void Constructor_ValidParameters_CreatesServiceRequest()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();

        // Act
        var serviceRequest = new ServiceRequest(tenantId, "Fix sink", "Leaking sink", customerId);

        // Assert
        serviceRequest.Should().NotBeNull();
        serviceRequest.TenantId.Should().Be(tenantId);
        serviceRequest.Title.Should().Be("Fix sink");
        serviceRequest.Description.Should().Be("Leaking sink");
        serviceRequest.CustomerId.Should().Be(customerId);
        serviceRequest.Status.Should().Be(ServiceRequestStatus.Pending);
        serviceRequest.AssignedWorkerId.Should().BeNull();
    }

    [Fact]
    public void AssignWorker_ValidWorker_AssignsWorker()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var workerId = Guid.NewGuid();
        var serviceRequest = new ServiceRequest(tenantId, "Fix sink", "Leaking sink", customerId);

        // Act
        serviceRequest.AssignWorker(workerId);

        // Assert
        serviceRequest.AssignedWorkerId.Should().Be(workerId);
        serviceRequest.Status.Should().Be(ServiceRequestStatus.Assigned);
    }

    [Fact]
    public void AssignWorker_NonPendingStatus_ThrowsInvalidOperationException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var workerId = Guid.NewGuid();
        var serviceRequest = new ServiceRequest(tenantId, "Fix sink", "Leaking sink", customerId);
        serviceRequest.AssignWorker(workerId);
        serviceRequest.ChangeStatus(ServiceRequestStatus.InProgress);

        // Act
        var act = () => serviceRequest.AssignWorker(Guid.NewGuid());

        // Assert
        act.Should().Throw<InvalidOperationException>().WithMessage("*status*");
    }

    [Fact]
    public void ChangeStatus_ValidTransition_ChangesStatus()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var workerId = Guid.NewGuid();
        var serviceRequest = new ServiceRequest(tenantId, "Fix sink", "Leaking sink", customerId);
        serviceRequest.AssignWorker(workerId);

        // Act
        serviceRequest.ChangeStatus(ServiceRequestStatus.InProgress);

        // Assert
        serviceRequest.Status.Should().Be(ServiceRequestStatus.InProgress);
    }

    [Fact]
    public void ChangeStatus_ToInProgressWithoutWorker_ThrowsInvalidOperationException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var serviceRequest = new ServiceRequest(tenantId, "Fix sink", "Leaking sink", customerId);

        // Act
        var act = () => serviceRequest.ChangeStatus(ServiceRequestStatus.InProgress);

        // Assert
        act.Should().Throw<InvalidOperationException>().WithMessage("*assigned worker*");
    }

    [Fact]
    public void ChangeStatus_FromCompleted_ThrowsInvalidOperationException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var workerId = Guid.NewGuid();
        var serviceRequest = new ServiceRequest(tenantId, "Fix sink", "Leaking sink", customerId);
        serviceRequest.AssignWorker(workerId);
        serviceRequest.ChangeStatus(ServiceRequestStatus.Completed);

        // Act
        var act = () => serviceRequest.ChangeStatus(ServiceRequestStatus.InProgress);

        // Assert
        act.Should().Throw<InvalidOperationException>().WithMessage("*Completed*");
    }

    [Fact]
    public void ChangeStatus_FromCancelled_ThrowsInvalidOperationException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var serviceRequest = new ServiceRequest(tenantId, "Fix sink", "Leaking sink", customerId);
        serviceRequest.ChangeStatus(ServiceRequestStatus.Cancelled);

        // Act
        var act = () => serviceRequest.ChangeStatus(ServiceRequestStatus.InProgress);

        // Assert
        act.Should().Throw<InvalidOperationException>().WithMessage("*Cancelled*");
    }

    [Fact]
    public void SoftDelete_MarksAsDeleted()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var serviceRequest = new ServiceRequest(tenantId, "Fix sink", "Leaking sink", customerId);

        // Act
        serviceRequest.SoftDelete();

        // Assert
        serviceRequest.IsDeleted.Should().BeTrue();
    }
}
