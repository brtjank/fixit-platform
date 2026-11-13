using FixIt.Application.Features.ServiceRequests.GetServiceRequests;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.GetServiceRequests;

public class GetServiceRequestsSearchAndSortTests
{
    private readonly Mock<IServiceRequestRepository> _serviceRequestRepositoryMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IQueryableExecutor> _queryableExecutorMock = new();
    private readonly GetServiceRequestsQueryHandler _handler;

    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly DateTime _baseTime = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly ServiceRequest _leakingTap;
    private readonly ServiceRequest _brokenHeater;
    private readonly ServiceRequest _paintWall;

    public GetServiceRequestsSearchAndSortTests()
    {
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

        var customerId = Guid.NewGuid();
        _leakingTap = CreateRequest("Leaking tap", "Kitchen sink drips", customerId, _baseTime);
        _brokenHeater = CreateRequest(
            "Broken heater",
            "No hot WATER in the bathroom",
            customerId,
            _baseTime.AddDays(2)
        );
        _paintWall = CreateRequest("Paint wall", "Living room", customerId, _baseTime.AddDays(1));
        _paintWall.AssignWorker(Guid.NewGuid());

        _serviceRequestRepositoryMock
            .Setup(x => x.GetByTenantId(_tenantId))
            .Returns(new List<ServiceRequest> { _leakingTap, _brokenHeater, _paintWall }.AsQueryable());

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(_tenantId);
        _currentUserServiceMock.Setup(x => x.Role).Returns(nameof(UserRole.Admin));
        _currentUserServiceMock.Setup(x => x.UserId).Returns(Guid.NewGuid());

        _handler = new GetServiceRequestsQueryHandler(
            _serviceRequestRepositoryMock.Object,
            _currentUserServiceMock.Object,
            _queryableExecutorMock.Object
        );
    }

    [Fact]
    public async Task Handle_NoSort_OrdersByCreatedAtDescending()
    {
        // Act
        var result = await _handler.Handle(new GetServiceRequestsQuery(), CancellationToken.None);

        // Assert
        result.Items.Should().ContainInOrder(_brokenHeater, _paintWall, _leakingTap);
    }

    [Fact]
    public async Task Handle_SortByTitleAscending_OrdersAlphabetically()
    {
        // Act
        var result = await _handler.Handle(
            new GetServiceRequestsQuery(Sort: "title:asc"),
            CancellationToken.None
        );

        // Assert
        result.Items.Should().ContainInOrder(_brokenHeater, _leakingTap, _paintWall);
    }

    [Fact]
    public async Task Handle_SortByCreatedAtAscending_OrdersOldestFirst()
    {
        // Act
        var result = await _handler.Handle(
            new GetServiceRequestsQuery(Sort: "createdAt"),
            CancellationToken.None
        );

        // Assert
        result.Items.Should().ContainInOrder(_leakingTap, _paintWall, _brokenHeater);
    }

    [Fact]
    public async Task Handle_EqualSortKeys_TieBreaksOnId()
    {
        // Arrange
        var sameTime = _baseTime.AddDays(5);
        var first = CreateRequest("Same", "Same", Guid.NewGuid(), sameTime);
        var second = CreateRequest("Same", "Same", Guid.NewGuid(), sameTime);
        _serviceRequestRepositoryMock
            .Setup(x => x.GetByTenantId(_tenantId))
            .Returns(new List<ServiceRequest> { first, second }.AsQueryable());

        // Act
        var result = await _handler.Handle(new GetServiceRequestsQuery(), CancellationToken.None);

        // Assert
        result.Items.Select(sr => sr.Id).Should().BeInAscendingOrder();
    }

    [Fact]
    public async Task Handle_InvalidSort_ThrowsServiceRequestSortInvalidException()
    {
        // Act
        var act = async () =>
            await _handler.Handle(
                new GetServiceRequestsQuery(Sort: "priority:desc"),
                CancellationToken.None
            );

        // Assert
        await act.Should().ThrowAsync<ServiceRequestSortInvalidException>();
    }

    [Fact]
    public async Task Handle_SearchMatchingTitle_FiltersCaseInsensitivelyAndCounts()
    {
        // Act
        var result = await _handler.Handle(
            new GetServiceRequestsQuery(Search: "  TAP "),
            CancellationToken.None
        );

        // Assert
        result.TotalCount.Should().Be(1);
        result.Items.Should().ContainSingle().Which.Should().Be(_leakingTap);
    }

    [Fact]
    public async Task Handle_SearchMatchingDescription_ReturnsMatch()
    {
        // Act
        var result = await _handler.Handle(
            new GetServiceRequestsQuery(Search: "water"),
            CancellationToken.None
        );

        // Assert
        result.TotalCount.Should().Be(1);
        result.Items.Should().ContainSingle().Which.Should().Be(_brokenHeater);
    }

    [Fact]
    public async Task Handle_SearchWithPaging_TotalCountReflectsFilteredSet()
    {
        // Act: "room" matches "bathroom" and "Living room"
        var result = await _handler.Handle(
            new GetServiceRequestsQuery(PageSize: 1, Search: "room"),
            CancellationToken.None
        );

        // Assert
        result.TotalCount.Should().Be(2);
        result.Items.Should().ContainSingle().Which.Should().Be(_brokenHeater);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Handle_BlankSearch_DoesNotFilter(string? search)
    {
        // Act
        var result = await _handler.Handle(
            new GetServiceRequestsQuery(Search: search),
            CancellationToken.None
        );

        // Assert
        result.TotalCount.Should().Be(3);
    }

    [Fact]
    public async Task Handle_SearchTooLong_ThrowsServiceRequestSearchTooLongException()
    {
        // Arrange
        var search = new string('a', GetServiceRequestsQueryHandler.SearchMaxLength + 1);

        // Act
        var act = async () =>
            await _handler.Handle(
                new GetServiceRequestsQuery(Search: search),
                CancellationToken.None
            );

        // Assert
        var exception = await act.Should().ThrowAsync<ServiceRequestSearchTooLongException>();
        exception.Which.ErrorCode.Should().Be("SR_006_SEARCH_TOO_LONG");
    }

    [Fact]
    public async Task Handle_SearchAtMaxLength_IsAccepted()
    {
        // Arrange
        var search = new string('a', GetServiceRequestsQueryHandler.SearchMaxLength);

        // Act
        var result = await _handler.Handle(
            new GetServiceRequestsQuery(Search: search),
            CancellationToken.None
        );

        // Assert
        result.TotalCount.Should().Be(0);
    }

    private ServiceRequest CreateRequest(
        string title,
        string description,
        Guid customerId,
        DateTime createdAt
    )
    {
        var request = new ServiceRequest(_tenantId, title, description, customerId);
        // CreatedAt has a protected setter; reflection gives deterministic timestamps for ordering tests
        typeof(BaseEntity).GetProperty(nameof(BaseEntity.CreatedAt))!.SetValue(request, createdAt);
        return request;
    }
}
