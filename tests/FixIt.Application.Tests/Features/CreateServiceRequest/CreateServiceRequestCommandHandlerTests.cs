using FixIt.Application.Features.CreateServiceRequest;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.CreateServiceRequest;

public class CreateServiceRequestCommandHandlerTests
{
    private readonly Mock<IServiceRequestRepository> _serviceRequestRepositoryMock;
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly CreateServiceRequestCommandHandler _handler;

    public CreateServiceRequestCommandHandlerTests()
    {
        _serviceRequestRepositoryMock = new Mock<IServiceRequestRepository>();
        _userRepositoryMock = new Mock<IUserRepository>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _handler = new CreateServiceRequestCommandHandler(
            _serviceRequestRepositoryMock.Object,
            _userRepositoryMock.Object,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task Handle_ValidRequest_CreatesServiceRequest()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var command = new CreateServiceRequestCommand(
            "Fix broken sink",
            "The sink in kitchen is leaking",
            customerId
        );

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);

        var customer = new User(tenantId, "customer@example.com", "John", "Doe", UserRole.Customer);
        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(customerId, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(customer);

        var createdServiceRequest = new ServiceRequest(
            tenantId,
            command.Title,
            command.Description,
            customerId
        );
        _serviceRequestRepositoryMock
            .Setup(x => x.AddAsync(It.IsAny<ServiceRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdServiceRequest);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be(command.Title);
        result.Description.Should().Be(command.Description);
        result.CustomerId.Should().Be(customerId);
        result.Status.Should().Be(ServiceRequestStatus.Pending);

        _userRepositoryMock.Verify(
            x => x.GetByIdAsync(customerId, tenantId, It.IsAny<CancellationToken>()),
            Times.Once
        );
        _serviceRequestRepositoryMock.Verify(
            x => x.AddAsync(It.IsAny<ServiceRequest>(), It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    [Fact]
    public async Task Handle_CustomerNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var command = new CreateServiceRequestCommand(
            "Fix broken sink",
            "The sink in kitchen is leaking",
            customerId
        );

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(customerId, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _serviceRequestRepositoryMock.Verify(
            x => x.AddAsync(It.IsAny<ServiceRequest>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    [Fact]
    public async Task Handle_CustomerFromDifferentTenant_ThrowsNotFoundException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var differentTenantId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var command = new CreateServiceRequestCommand(
            "Fix broken sink",
            "The sink in kitchen is leaking",
            customerId
        );

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);

        var customerFromDifferentTenant = new User(
            differentTenantId,
            "customer@example.com",
            "John",
            "Doe",
            UserRole.Customer
        );
        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(customerId, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(customerFromDifferentTenant);

        // Act
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _serviceRequestRepositoryMock.Verify(
            x => x.AddAsync(It.IsAny<ServiceRequest>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }
}
