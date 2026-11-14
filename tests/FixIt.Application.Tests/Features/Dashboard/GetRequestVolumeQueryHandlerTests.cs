using FixIt.Application.Features.Dashboard.GetRequestVolume;
using FixIt.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace FixIt.Application.Tests.Features.Dashboard;

public class GetRequestVolumeQueryHandlerTests : DashboardTestBase
{
    private static readonly DateOnly Today = DateOnly.FromDateTime(Now);
    private readonly GetRequestVolumeQueryHandler _handler;

    public GetRequestVolumeQueryHandlerTests()
    {
        _handler = new GetRequestVolumeQueryHandler(
            Data.ServiceRequestRepository.Object,
            Data.ServiceLogRepository.Object,
            CurrentUser.Object,
            Executor,
            Clock
        );
    }

    [Theory]
    [InlineData(null, 30)]
    [InlineData(-5, 7)]
    [InlineData(3, 7)]
    [InlineData(7, 7)]
    [InlineData(45, 45)]
    [InlineData(90, 90)]
    [InlineData(500, 90)]
    public async Task Handle_Days_ClampedAndReturnsExactlyThatManyPointsEndingToday(
        int? days,
        int expectedPoints
    )
    {
        // Act
        var result = await _handler.Handle(new GetRequestVolumeQuery(days), CancellationToken.None);

        // Assert
        result.Points.Should().HaveCount(expectedPoints);
        result.Points[^1].Date.Should().Be(Today);
        result.Points[0].Date.Should().Be(Today.AddDays(-(expectedPoints - 1)));
        result.Points.Select(p => p.Date).Should().BeInAscendingOrder().And.OnlyHaveUniqueItems();
    }

    [Fact]
    public async Task Handle_RequestsAndCompletions_CountedPerUtcDayAndZeroFilled()
    {
        // Arrange
        AddRequest(createdAt: Now.Date.AddHours(1)); // today
        AddRequest(createdAt: Now.Date.AddDays(-2).AddHours(23).AddMinutes(59)); // 2 days ago
        AddRequest(createdAt: Now.Date.AddDays(-2)); // 2 days ago, midnight
        AddRequest(createdAt: Now.Date.AddDays(-7)); // outside a 7-day window
        var request = AddRequest(createdAt: Now.Date.AddDays(-20));
        AddLog(request, ServiceRequestStatus.InProgress, ServiceRequestStatus.Completed, Now.Date.AddDays(-1).AddHours(8));
        AddLog(request, ServiceRequestStatus.Pending, ServiceRequestStatus.Assigned, Now.Date.AddDays(-1).AddHours(7));

        // Act
        var result = await _handler.Handle(new GetRequestVolumeQuery(7), CancellationToken.None);

        // Assert
        result.Points.Should().Equal(
            new DailyVolumePoint(Today.AddDays(-6), 0, 0),
            new DailyVolumePoint(Today.AddDays(-5), 0, 0),
            new DailyVolumePoint(Today.AddDays(-4), 0, 0),
            new DailyVolumePoint(Today.AddDays(-3), 0, 0),
            new DailyVolumePoint(Today.AddDays(-2), 2, 0),
            new DailyVolumePoint(Today.AddDays(-1), 0, 1),
            new DailyVolumePoint(Today, 1, 0)
        );
    }
}
