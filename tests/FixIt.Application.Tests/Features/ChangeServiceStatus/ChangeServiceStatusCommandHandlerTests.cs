using FixIt.Application.Features.ServiceRequests.ChangeServiceStatus;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.ChangeServiceStatus;

public class ChangeServiceStatusCommandHandlerTests
{
    private readonly Mock<IServiceRequestRepository> _serviceRequestRepositoryMock;
    private readonly Mock<IServiceLogRepository> _serviceLogRepositoryMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly ChangeServiceStatusCommandHandler _handler;

    public ChangeServiceStatusCommandHandlerTests()
    {
        _serviceRequestRepositoryMock = new Mock<IServiceRequestRepository>();
        _serviceLogRepositoryMock = new Mock<IServiceLogRepository>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _handler = new ChangeServiceStatusCommandHandler(
            _serviceRequestRepositoryMock.Object,
            _serviceLogRepositoryMock.Object,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task Handle_ValidRequest_ChangesStatus()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var serviceRequestId = Guid.NewGuid();
        var workerId = Guid.NewGuid();
        var changedByUserId = Guid.NewGuid();

        var serviceRequest = new ServiceRequest(
            tenantId,
            "Fix sink",
            "Leaking sink",
            Guid.NewGuid()
        );
        serviceRequest.AssignWorker(workerId);

        _serviceRequestRepositoryMock
            .Setup(x => x.GetByIdAsync(serviceRequestId, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(serviceRequest);

        _serviceRequestRepositoryMock
            .Setup(x => x.UpdateAsync(It.IsAny<ServiceRequest>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _serviceLogRepositoryMock
            .Setup(x => x.AddAsync(It.IsAny<ServiceLog>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ServiceLog log, CancellationToken _) => log);

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);
        _currentUserServiceMock.Setup(x => x.UserId).Returns(changedByUserId);

        var command = new ChangeServiceStatusCommand(
            serviceRequestId,
            ServiceRequestStatus.InProgress,
            "Starting work"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.ServiceRequestId.Should().Be(serviceRequest.Id);
        result.Status.Should().Be(ServiceRequestStatus.InProgress);

        _serviceRequestRepositoryMock.Verify(
            x => x.UpdateAsync(It.IsAny<ServiceRequest>(), It.IsAny<CancellationToken>()),
            Times.Once
        );
        _serviceLogRepositoryMock.Verify(
            x => x.AddAsync(It.IsAny<ServiceLog>(), It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    [Fact]
    public async Task Handle_ServiceRequestNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var serviceRequestId = Guid.NewGuid();

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);
        _currentUserServiceMock.Setup(x => x.UserId).Returns(Guid.NewGuid());

        _serviceRequestRepositoryMock
            .Setup(x => x.GetByIdAsync(serviceRequestId, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ServiceRequest?)null);

        var command = new ChangeServiceStatusCommand(
            serviceRequestId,
            ServiceRequestStatus.InProgress
        );

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_ChangeStatusToInProgressWithoutWorker_ThrowsServiceRequestWorkerRequiredException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var serviceRequestId = Guid.NewGuid();

        var serviceRequest = new ServiceRequest(
            tenantId,
            "Fix sink",
            "Leaking sink",
            Guid.NewGuid()
        );

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);
        _currentUserServiceMock.Setup(x => x.UserId).Returns(Guid.NewGuid());

        _serviceRequestRepositoryMock
            .Setup(x => x.GetByIdAsync(serviceRequestId, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(serviceRequest);

        var command = new ChangeServiceStatusCommand(
            serviceRequestId,
            ServiceRequestStatus.InProgress
        );

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        var exception = await act.Should().ThrowAsync<ServiceRequestWorkerRequiredException>();
        exception.Which.ServiceRequestId.Should().Be(serviceRequest.Id);
    }

    [Fact]
    public async Task Handle_ChangeStatusOfCompletedRequest_ThrowsServiceRequestStatusImmutableException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var serviceRequestId = Guid.NewGuid();
        var workerId = Guid.NewGuid();

        var serviceRequest = new ServiceRequest(
            tenantId,
            "Fix sink",
            "Leaking sink",
            Guid.NewGuid()
        );
        serviceRequest.AssignWorker(workerId);
        serviceRequest.ChangeStatus(ServiceRequestStatus.Completed);

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);
        _currentUserServiceMock.Setup(x => x.UserId).Returns(Guid.NewGuid());

        _serviceRequestRepositoryMock
            .Setup(x => x.GetByIdAsync(serviceRequestId, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(serviceRequest);

        var command = new ChangeServiceStatusCommand(
            serviceRequestId,
            ServiceRequestStatus.InProgress
        );

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        var exception = await act.Should().ThrowAsync<ServiceRequestStatusImmutableException>();
        exception.Which.ServiceRequestId.Should().Be(serviceRequest.Id);
        exception.Which.CurrentStatus.Should().Be(ServiceRequestStatus.Completed);
    }
}
