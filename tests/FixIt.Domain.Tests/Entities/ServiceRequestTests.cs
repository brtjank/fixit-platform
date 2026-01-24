using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
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
    public void AssignWorker_NonPendingStatus_ThrowsServiceRequestStatusInvalidForAssignmentException()
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
        var exception = act.Should().Throw<ServiceRequestStatusInvalidForAssignmentException>().Which;
        exception.ServiceRequestId.Should().Be(serviceRequest.Id);
        exception.CurrentStatus.Should().Be(ServiceRequestStatus.InProgress);
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
    public void ChangeStatus_ToInProgressWithoutWorker_ThrowsServiceRequestWorkerRequiredException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var serviceRequest = new ServiceRequest(tenantId, "Fix sink", "Leaking sink", customerId);

        // Act
        var act = () => serviceRequest.ChangeStatus(ServiceRequestStatus.InProgress);

        // Assert
        var exception = act.Should().Throw<ServiceRequestWorkerRequiredException>().Which;
        exception.ServiceRequestId.Should().Be(serviceRequest.Id);
    }

    [Fact]
    public void ChangeStatus_FromCompleted_ThrowsServiceRequestStatusImmutableException()
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
        var exception = act.Should().Throw<ServiceRequestStatusImmutableException>().Which;
        exception.ServiceRequestId.Should().Be(serviceRequest.Id);
        exception.CurrentStatus.Should().Be(ServiceRequestStatus.Completed);
    }

    [Fact]
    public void ChangeStatus_FromCancelled_ThrowsServiceRequestStatusImmutableException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var serviceRequest = new ServiceRequest(tenantId, "Fix sink", "Leaking sink", customerId);
        serviceRequest.ChangeStatus(ServiceRequestStatus.Cancelled);

        // Act
        var act = () => serviceRequest.ChangeStatus(ServiceRequestStatus.InProgress);

        // Assert
        var exception = act.Should().Throw<ServiceRequestStatusImmutableException>().Which;
        exception.ServiceRequestId.Should().Be(serviceRequest.Id);
        exception.CurrentStatus.Should().Be(ServiceRequestStatus.Cancelled);
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
