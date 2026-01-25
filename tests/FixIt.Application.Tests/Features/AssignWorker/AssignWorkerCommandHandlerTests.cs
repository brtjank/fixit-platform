using FixIt.Application.Features.AssignWorker;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.AssignWorker;

public class AssignWorkerCommandHandlerTests
{
    private readonly Mock<IServiceRequestRepository> _serviceRequestRepositoryMock;
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly AssignWorkerCommandHandler _handler;

    public AssignWorkerCommandHandlerTests()
    {
        _serviceRequestRepositoryMock = new Mock<IServiceRequestRepository>();
        _userRepositoryMock = new Mock<IUserRepository>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _handler = new AssignWorkerCommandHandler(
            _serviceRequestRepositoryMock.Object,
            _userRepositoryMock.Object,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task Handle_ValidRequest_AssignsWorker()
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
        var worker = new User(tenantId, "worker@example.com", "Jane", "Smith", UserRole.Worker);

        _serviceRequestRepositoryMock
            .Setup(x => x.GetByIdAsync(serviceRequestId, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(serviceRequest);

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(workerId, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(worker);

        _serviceRequestRepositoryMock
            .Setup(x => x.UpdateAsync(It.IsAny<ServiceRequest>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);

        var command = new AssignWorkerCommand(serviceRequestId, workerId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.ServiceRequestId.Should().Be(serviceRequest.Id);
        result.AssignedWorkerId.Should().Be(workerId);
        result.Status.Should().Be(ServiceRequestStatus.Assigned);

        _serviceRequestRepositoryMock.Verify(
            x => x.UpdateAsync(It.IsAny<ServiceRequest>(), It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    [Fact]
    public async Task Handle_ServiceRequestNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var serviceRequestId = Guid.NewGuid();
        var workerId = Guid.NewGuid();

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);

        _serviceRequestRepositoryMock
            .Setup(x => x.GetByIdAsync(serviceRequestId, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ServiceRequest?)null);

        var command = new AssignWorkerCommand(serviceRequestId, workerId);

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _serviceRequestRepositoryMock.Verify(
            x => x.UpdateAsync(It.IsAny<ServiceRequest>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    [Fact]
    public async Task Handle_WorkerNotFound_ThrowsNotFoundException()
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

        _serviceRequestRepositoryMock
            .Setup(x => x.GetByIdAsync(serviceRequestId, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(serviceRequest);

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(workerId, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var command = new AssignWorkerCommand(serviceRequestId, workerId);

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_UserIsNotWorker_ThrowsBadRequestException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var serviceRequestId = Guid.NewGuid();
        var customerId = Guid.NewGuid();

        var serviceRequest = new ServiceRequest(tenantId, "Fix sink", "Leaking sink", customerId);
        var customer = new User(tenantId, "customer@example.com", "John", "Doe", UserRole.Customer);

        _serviceRequestRepositoryMock
            .Setup(x => x.GetByIdAsync(serviceRequestId, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(serviceRequest);

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(customerId, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(customer);

        var command = new AssignWorkerCommand(serviceRequestId, customerId);

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<BadRequestException>().WithMessage($"*Worker*");
    }

    [Fact]
    public async Task Handle_ServiceRequestFromDifferentTenant_ThrowsNotFoundException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var differentTenantId = Guid.NewGuid();
        var serviceRequestId = Guid.NewGuid();
        var workerId = Guid.NewGuid();

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);

        _serviceRequestRepositoryMock
            .Setup(x => x.GetByIdAsync(serviceRequestId, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ServiceRequest?)null);

        var command = new AssignWorkerCommand(serviceRequestId, workerId);

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }
}
