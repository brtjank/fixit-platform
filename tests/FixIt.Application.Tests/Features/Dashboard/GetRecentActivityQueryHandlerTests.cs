using FixIt.Application.Features.Dashboard.GetRecentActivity;
using FixIt.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace FixIt.Application.Tests.Features.Dashboard;

public class GetRecentActivityQueryHandlerTests : DashboardTestBase
{
    private readonly GetRecentActivityQueryHandler _handler;

    public GetRecentActivityQueryHandlerTests()
    {
        _handler = new GetRecentActivityQueryHandler(
            Data.ServiceRequestRepository.Object,
            Data.ServiceLogRepository.Object,
            Data.UserRepository.Object,
            CurrentUser.Object,
            Executor
        );
    }

    [Theory]
    [InlineData(ServiceRequestStatus.Assigned, "assigned")]
    [InlineData(ServiceRequestStatus.Completed, "completed")]
    [InlineData(ServiceRequestStatus.Cancelled, "cancelled")]
    [InlineData(ServiceRequestStatus.InProgress, "status_changed")]
    [InlineData(ServiceRequestStatus.Pending, "status_changed")]
    public async Task Handle_Log_MapsNewStatusToType(ServiceRequestStatus newStatus, string expected)
    {
        // Arrange
        var request = AddRequest(createdAt: Now.AddDays(-2));
        var log = AddLog(request, ServiceRequestStatus.Pending, newStatus, Now.AddHours(-1));

        // Act
        var result = await Handle(10);

        // Assert
        result.Items.Single(i => i.Id == log.Id.ToString()).Type.Should().Be(expected);
    }

    [Fact]
    public async Task Handle_LogWithKnownActorAndNoNotes_UsesActorNameAndStatusTransition()
    {
        // Arrange
        var admin = AddUser(UserRole.Admin, "Marta", "Nowak");
        var request = AddRequest(createdAt: Now.AddDays(-2), title: "Boiler service");
        var log = AddLog(
            request,
            ServiceRequestStatus.Pending,
            ServiceRequestStatus.Assigned,
            Now.AddHours(-1),
            changedBy: admin.Id
        );

        // Act
        var result = await Handle(10);

        // Assert
        result.Items[0].Should().Be(
            new ActivityItem(
                log.Id.ToString(),
                "assigned",
                request.Id,
                "Boiler service",
                "Marta Nowak",
                Now.AddHours(-1),
                "Pending → Assigned"
            )
        );
    }

    [Theory]
    [InlineData(null)]
    [InlineData("   ")]
    public async Task Handle_LogWithBlankNotes_FallsBackToTransition(string? notes)
    {
        // Arrange
        var request = AddRequest(createdAt: Now.AddDays(-2));
        AddLog(request, ServiceRequestStatus.Assigned, ServiceRequestStatus.InProgress, Now, notes);

        // Act
        var result = await Handle(1);

        // Assert
        result.Items.Single().Detail.Should().Be("Assigned → InProgress");
    }

    [Fact]
    public async Task Handle_LogWithNotes_UsesNotesAsDetail()
    {
        // Arrange
        var request = AddRequest(createdAt: Now.AddDays(-2));
        AddLog(request, ServiceRequestStatus.Assigned, ServiceRequestStatus.InProgress, Now, "On site");

        // Act
        var result = await Handle(1);

        // Assert
        result.Items.Single().Detail.Should().Be("On site");
    }

    [Fact]
    public async Task Handle_LogWithoutOrWithUnknownActor_ReportsSystem()
    {
        // Arrange
        var request = AddRequest(createdAt: Now.AddDays(-2));
        AddLog(request, ServiceRequestStatus.Pending, ServiceRequestStatus.Assigned, Now.AddHours(-2));
        AddLog(
            request,
            ServiceRequestStatus.Assigned,
            ServiceRequestStatus.InProgress,
            Now.AddHours(-1),
            changedBy: Guid.NewGuid()
        );

        // Act
        var result = await Handle(2);

        // Assert
        result.Items.Should().HaveCount(2).And.OnlyContain(i => i.ActorName == "System");
    }

    [Fact]
    public async Task Handle_RequestCreation_ProducesCreatedItemWithCustomerName()
    {
        // Arrange
        var customer = AddUser(UserRole.Customer, "Bartosz", "Jankowski");
        var request = AddRequest(createdAt: Now.AddHours(-3), customerId: customer.Id, title: "Sink");

        // Act
        var result = await Handle(10);

        // Assert
        result.Items.Should().Equal(
            new ActivityItem(
                $"created:{request.Id}",
                "created",
                request.Id,
                "Sink",
                "Bartosz Jankowski",
                Now.AddHours(-3),
                null
            )
        );
    }

    [Fact]
    public async Task Handle_BothSources_MergedNewestFirstAndCutToLimit()
    {
        // Arrange
        var older = AddRequest(createdAt: Now.AddHours(-10));
        var newer = AddRequest(createdAt: Now.AddHours(-4));
        var assigned = AddLog(older, ServiceRequestStatus.Pending, ServiceRequestStatus.Assigned, Now.AddHours(-6));
        var completed = AddLog(older, ServiceRequestStatus.InProgress, ServiceRequestStatus.Completed, Now.AddHours(-1));

        // Act
        var result = await Handle(3);

        // Assert
        result.Items.Select(i => i.Id).Should().Equal(
            completed.Id.ToString(),
            $"created:{newer.Id}",
            assigned.Id.ToString()
        );
    }

    [Theory]
    [InlineData(null, 10)]
    [InlineData(0, 1)]
    [InlineData(-3, 1)]
    [InlineData(25, 25)]
    [InlineData(200, 50)]
    public async Task Handle_Limit_IsClamped(int? limit, int expected)
    {
        // Arrange
        for (var i = 0; i < 60; i++)
            AddRequest(createdAt: Now.AddMinutes(-i));

        // Act
        var result = await Handle(limit);

        // Assert
        result.Items.Should().HaveCount(expected);
    }

    [Fact]
    public async Task Handle_DeletedRequest_ItsCreationAndLogsAreHidden()
    {
        // Arrange
        var request = AddRequest(createdAt: Now.AddHours(-2));
        AddLog(request, ServiceRequestStatus.Pending, ServiceRequestStatus.Assigned, Now.AddHours(-1));
        request.SoftDelete();

        // Act
        var result = await Handle(10);

        // Assert
        result.Items.Should().BeEmpty();
    }

    private Task<GetRecentActivityResponse> Handle(int? limit) =>
        _handler.Handle(new GetRecentActivityQuery(limit), CancellationToken.None);
}
