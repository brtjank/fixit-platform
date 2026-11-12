using FixIt.Application.Features.ServiceRequests.GetServiceRequestLogs;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.GetServiceRequestLogs;

public class GetServiceRequestLogsQueryHandlerTests
{
    private readonly Mock<IServiceRequestRepository> _serviceRequestRepositoryMock;
    private readonly Mock<IServiceLogRepository> _serviceLogRepositoryMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly GetServiceRequestLogsQueryHandler _handler;

    public GetServiceRequestLogsQueryHandlerTests()
    {
        _serviceRequestRepositoryMock = new Mock<IServiceRequestRepository>();
        _serviceLogRepositoryMock = new Mock<IServiceLogRepository>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _handler = new GetServiceRequestLogsQueryHandler(
            _serviceRequestRepositoryMock.Object,
            _serviceLogRepositoryMock.Object,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task Handle_OwnTenantRequest_ReturnsLogs()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var serviceRequest = new ServiceRequest(tenantId, "Fix sink", "Leaking", Guid.NewGuid());
        var logs = new List<ServiceLog>
        {
            new(tenantId, serviceRequest.Id, ServiceRequestStatus.Pending, ServiceRequestStatus.Assigned),
            new(tenantId, serviceRequest.Id, ServiceRequestStatus.Assigned, ServiceRequestStatus.InProgress, "Started"),
        };

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);
        _currentUserServiceMock.Setup(x => x.Role).Returns(nameof(UserRole.Admin));

        _serviceRequestRepositoryMock
            .Setup(x => x.GetByIdAsync(serviceRequest.Id, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(serviceRequest);

        _serviceLogRepositoryMock
            .Setup(x =>
                x.GetByServiceRequestIdAsync(serviceRequest.Id, tenantId, It.IsAny<CancellationToken>())
            )
            .ReturnsAsync(logs);

        // Act
        var result = await _handler.Handle(
            new GetServiceRequestLogsQuery(serviceRequest.Id),
            CancellationToken.None
        );

        // Assert
        result.Logs.Should().HaveCount(2);
        result.Logs.Should().OnlyContain(l => l.ServiceRequestId == serviceRequest.Id);
        result.Logs.Should().BeInAscendingOrder(l => l.CreatedAt);
    }

    [Fact]
    public async Task Handle_OtherTenantRequest_ThrowsResourceNotFoundException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var otherTenantRequest = new ServiceRequest(
            Guid.NewGuid(),
            "Fix sink",
            "Leaking",
            Guid.NewGuid()
        );

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);
        _currentUserServiceMock.Setup(x => x.Role).Returns(nameof(UserRole.Admin));

        _serviceRequestRepositoryMock
            .Setup(x =>
                x.GetByIdAsync(otherTenantRequest.Id, tenantId, It.IsAny<CancellationToken>())
            )
            .ReturnsAsync(otherTenantRequest);

        // Act
        var act = async () =>
            await _handler.Handle(
                new GetServiceRequestLogsQuery(otherTenantRequest.Id),
                CancellationToken.None
            );

        // Assert
        await act.Should().ThrowAsync<ResourceNotFoundException>();
        _serviceLogRepositoryMock.Verify(
            x =>
                x.GetByServiceRequestIdAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<CancellationToken>()
                ),
            Times.Never
        );
    }

    [Fact]
    public async Task Handle_CustomerViewingSomeoneElsesRequest_ThrowsResourceNotFoundException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var currentCustomerId = Guid.NewGuid();
        var serviceRequest = new ServiceRequest(tenantId, "Fix sink", "Leaking", Guid.NewGuid());

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);
        _currentUserServiceMock.Setup(x => x.UserId).Returns(currentCustomerId);
        _currentUserServiceMock.Setup(x => x.Role).Returns(nameof(UserRole.Customer));

        _serviceRequestRepositoryMock
            .Setup(x => x.GetByIdAsync(serviceRequest.Id, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(serviceRequest);

        // Act
        var act = async () =>
            await _handler.Handle(
                new GetServiceRequestLogsQuery(serviceRequest.Id),
                CancellationToken.None
            );

        // Assert
        await act.Should().ThrowAsync<ResourceNotFoundException>();
    }
}
