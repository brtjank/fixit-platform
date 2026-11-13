using FixIt.Application.Features.Dashboard.GetDashboardStats;
using FixIt.Application.Tests.Common.Builders;
using FixIt.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace FixIt.Application.Tests.Features.Dashboard;

public class GetDashboardStatsQueryHandlerTests : DashboardTestBase
{
    private readonly GetDashboardStatsQueryHandler _handler;

    public GetDashboardStatsQueryHandlerTests()
    {
        _handler = new GetDashboardStatsQueryHandler(
            Data.ServiceRequestRepository.Object,
            Data.ServiceLogRepository.Object,
            Data.UserRepository.Object,
            Data.WorkerProfileRepository.Object,
            CurrentUser.Object,
            Executor,
            Clock
        );
    }

    [Fact]
    public async Task Handle_EmptyTenant_ReturnsZeros()
    {
        // Act
        var result = await Handle();

        // Assert
        result.Should().Be(
            new GetDashboardStatsResponse(0, 0, 0, 0, 0, 0, 0, new DashboardTrends(0, 0, 0))
        );
    }

    [Fact]
    public async Task Handle_RequestsInEveryStatus_CountsOpenPendingAndInProgress()
    {
        // Arrange
        AddRequest(ServiceRequestStatus.Pending);
        AddRequest(ServiceRequestStatus.Pending);
        AddRequest(ServiceRequestStatus.Assigned);
        AddRequest(ServiceRequestStatus.InProgress);
        AddRequest(ServiceRequestStatus.Completed);
        AddRequest(ServiceRequestStatus.Cancelled);
        AddRequest(ServiceRequestStatus.InProgress).SoftDelete();

        // Act
        var result = await Handle();

        // Assert
        result.OpenRequests.Should().Be(4);
        result.PendingUnassigned.Should().Be(2);
        result.InProgress.Should().Be(1);
    }

    [Fact]
    public async Task Handle_Completions_WindowedByCompletedAtNotCreatedAt()
    {
        // Arrange
        AddCompleted(createdAt: Now.AddDays(-45), completedAt: Now.AddDays(-5)); // current window
        AddCompleted(createdAt: Now.AddDays(-50), completedAt: Now.AddDays(-35)); // previous window
        AddCompleted(createdAt: Now.AddDays(-80), completedAt: Now.AddDays(-61)); // older than both

        // Act
        var result = await Handle();

        // Assert
        result.CompletedLast30Days.Should().Be(1);
        result.Trends.CompletedLast30Days.Should().Be(0); // 1 vs 1
    }

    [Fact]
    public async Task Handle_AverageResolution_IsMeanHoursRoundedToOneDecimal()
    {
        // Arrange: 10h and 10.5h -> 10.25h, which must round away from zero to 10.3
        AddCompleted(createdAt: Now.AddDays(-3), completedAt: Now.AddDays(-3).AddHours(10));
        AddCompleted(createdAt: Now.AddDays(-2), completedAt: Now.AddDays(-2).AddHours(10.5));

        // Act
        var result = await Handle();

        // Assert
        result.CompletedLast30Days.Should().Be(2);
        result.AvgResolutionHours.Should().Be(10.3);
    }

    [Fact]
    public async Task Handle_CompletionsInBothWindows_ComputesTrendsFromUnroundedAverages()
    {
        // Arrange: current avg 10.25h over 2, previous avg 20h over 1
        AddCompleted(createdAt: Now.AddDays(-3), completedAt: Now.AddDays(-3).AddHours(10));
        AddCompleted(createdAt: Now.AddDays(-2), completedAt: Now.AddDays(-2).AddHours(10.5));
        AddCompleted(createdAt: Now.AddDays(-40), completedAt: Now.AddDays(-40).AddHours(20));

        // Act
        var result = await Handle();

        // Assert
        result.Trends.CompletedLast30Days.Should().Be(100);
        result.Trends.AvgResolutionHours.Should().Be(-48.8);
    }

    [Fact]
    public async Task Handle_NoCompletionsInPreviousWindow_ResolutionTrendIsZero()
    {
        // Arrange
        AddCompleted(createdAt: Now.AddDays(-3), completedAt: Now.AddDays(-2));

        // Act
        var result = await Handle();

        // Assert
        result.Trends.CompletedLast30Days.Should().Be(100);
        result.Trends.AvgResolutionHours.Should().Be(0);
    }

    [Fact]
    public async Task Handle_CompletedWithoutCompletedLog_IsNotCountedAsCompleted()
    {
        // Arrange
        AddRequest(ServiceRequestStatus.Completed, Now.AddDays(-1));

        // Act
        var result = await Handle();

        // Assert
        result.CompletedLast30Days.Should().Be(0);
        result.AvgResolutionHours.Should().Be(0);
    }

    [Fact]
    public async Task Handle_CreatedRequests_DriveTheOpenRequestsTrend()
    {
        // Arrange: 3 created in the last 30 days, 2 in the previous 30 (incl. the boundary), 1 older
        AddRequest(createdAt: Now.AddDays(-1));
        AddRequest(createdAt: Now.AddDays(-10));
        AddRequest(createdAt: Now.AddDays(-29));
        AddRequest(createdAt: Now.AddDays(-30)); // boundary belongs to the previous window
        AddRequest(createdAt: Now.AddDays(-59));
        AddRequest(createdAt: Now.AddDays(-61));

        // Act
        var result = await Handle();

        // Assert
        result.Trends.OpenRequests.Should().Be(50); // 3 vs 2
    }

    [Fact]
    public async Task Handle_CreatedOnlyInCurrentWindow_OpenRequestsTrendIs100()
    {
        // Arrange
        AddRequest(createdAt: Now.AddDays(-1));

        // Act
        var result = await Handle();

        // Assert
        result.Trends.OpenRequests.Should().Be(100);
    }

    [Fact]
    public async Task Handle_Workers_CountsActiveAndAvailableTreatingMissingProfileAsAvailable()
    {
        // Arrange
        AddUser(UserRole.Worker); // no profile -> available
        var withAvailableProfile = AddUser(UserRole.Worker);
        var withUnavailableProfile = AddUser(UserRole.Worker);
        var inactive = new UserBuilder()
            .WithTenantId(TenantId)
            .WithRole(UserRole.Worker)
            .AsInactive()
            .Build();
        Data.Users.Add(inactive);
        AddUser(UserRole.Admin);
        Data.Profiles.Add(
            new WorkerProfileBuilder()
                .WithTenantId(TenantId)
                .WithUserId(withAvailableProfile.Id)
                .Build()
        );
        Data.Profiles.Add(
            new WorkerProfileBuilder()
                .WithTenantId(TenantId)
                .WithUserId(withUnavailableProfile.Id)
                .AsUnavailable()
                .Build()
        );

        // Act
        var result = await Handle();

        // Assert
        result.ActiveWorkers.Should().Be(3);
        result.AvailableWorkers.Should().Be(2);
    }

    [Fact]
    public async Task Handle_OtherTenantData_IsExcluded()
    {
        // Arrange
        Data.Requests.Add(
            new ServiceRequestBuilder()
                .WithTenantId(Guid.NewGuid())
                .CreatedAt(Now.AddDays(-1))
                .Build()
        );
        Data.Users.Add(new UserBuilder().WithRole(UserRole.Worker).Build());

        // Act
        var result = await Handle();

        // Assert
        result.OpenRequests.Should().Be(0);
        result.ActiveWorkers.Should().Be(0);
        result.Trends.OpenRequests.Should().Be(0);
    }

    private Task<GetDashboardStatsResponse> Handle() =>
        _handler.Handle(new GetDashboardStatsQuery(), CancellationToken.None);
}
