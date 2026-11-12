using FixIt.Application.Features.ServiceRequests.GetServiceRequests;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.GetServiceRequests;

public class GetServiceRequestsQueryHandlerTests
{
    private readonly Mock<IServiceRequestRepository> _serviceRequestRepositoryMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly Mock<IQueryableExecutor> _queryableExecutorMock;
    private readonly GetServiceRequestsQueryHandler _handler;

    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Guid _customerA = Guid.NewGuid();
    private readonly Guid _customerB = Guid.NewGuid();

    public GetServiceRequestsQueryHandlerTests()
    {
        _serviceRequestRepositoryMock = new Mock<IServiceRequestRepository>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _queryableExecutorMock = new Mock<IQueryableExecutor>();

        // Execute queries in memory against List.AsQueryable()
        _queryableExecutorMock
            .Setup(x =>
                x.CountAsync(It.IsAny<IQueryable<ServiceRequest>>(), It.IsAny<CancellationToken>())
            )
            .ReturnsAsync((IQueryable<ServiceRequest> q, CancellationToken _) => q.Count());
        _queryableExecutorMock
            .Setup(x =>
                x.ToListAsync(It.IsAny<IQueryable<ServiceRequest>>(), It.IsAny<CancellationToken>())
            )
            .ReturnsAsync((IQueryable<ServiceRequest> q, CancellationToken _) => q.ToList());

        var data = new List<ServiceRequest>
        {
            new(_tenantId, "A1", "desc", _customerA),
            new(_tenantId, "A2", "desc", _customerA),
            new(_tenantId, "B1", "desc", _customerB),
        };
        _serviceRequestRepositoryMock
            .Setup(x => x.GetByTenantId(_tenantId))
            .Returns(data.AsQueryable());

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(_tenantId);

        _handler = new GetServiceRequestsQueryHandler(
            _serviceRequestRepositoryMock.Object,
            _currentUserServiceMock.Object,
            _queryableExecutorMock.Object
        );
    }

    [Fact]
    public async Task Handle_CustomerIdFilter_ReturnsOnlyThatCustomersRequests()
    {
        // Arrange
        _currentUserServiceMock.Setup(x => x.Role).Returns(nameof(UserRole.Admin));
        _currentUserServiceMock.Setup(x => x.UserId).Returns(Guid.NewGuid());

        // Act
        var result = await _handler.Handle(
            new GetServiceRequestsQuery(CustomerId: _customerB),
            CancellationToken.None
        );

        // Assert
        result.TotalCount.Should().Be(1);
        result.Items.Should().OnlyContain(sr => sr.CustomerId == _customerB);
    }

    [Fact]
    public async Task Handle_AdminWithoutFilter_ReturnsAllTenantRequests()
    {
        // Arrange
        _currentUserServiceMock.Setup(x => x.Role).Returns(nameof(UserRole.Admin));
        _currentUserServiceMock.Setup(x => x.UserId).Returns(Guid.NewGuid());

        // Act
        var result = await _handler.Handle(new GetServiceRequestsQuery(), CancellationToken.None);

        // Assert
        result.TotalCount.Should().Be(3);
    }

    [Fact]
    public async Task Handle_CustomerRole_ForcesScopingToCurrentUser()
    {
        // Arrange
        _currentUserServiceMock.Setup(x => x.Role).Returns(nameof(UserRole.Customer));
        _currentUserServiceMock.Setup(x => x.UserId).Returns(_customerA);

        // Act
        var result = await _handler.Handle(new GetServiceRequestsQuery(), CancellationToken.None);

        // Assert
        result.TotalCount.Should().Be(2);
        result.Items.Should().OnlyContain(sr => sr.CustomerId == _customerA);
    }

    [Fact]
    public async Task Handle_CustomerRoleRequestingOtherCustomerId_StillReturnsOwnRequests()
    {
        // Arrange
        _currentUserServiceMock.Setup(x => x.Role).Returns(nameof(UserRole.Customer));
        _currentUserServiceMock.Setup(x => x.UserId).Returns(_customerA);

        // Act
        var result = await _handler.Handle(
            new GetServiceRequestsQuery(CustomerId: _customerB),
            CancellationToken.None
        );

        // Assert
        result.Items.Should().NotBeEmpty();
        result.Items.Should().OnlyContain(sr => sr.CustomerId == _customerA);
    }
}
