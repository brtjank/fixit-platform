using FixIt.Application.Features.Dashboard.GetStatusBreakdown;
using FixIt.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace FixIt.Application.Tests.Features.Dashboard;

public class GetStatusBreakdownQueryHandlerTests : DashboardTestBase
{
    private readonly GetStatusBreakdownQueryHandler _handler;

    public GetStatusBreakdownQueryHandlerTests()
    {
        _handler = new GetStatusBreakdownQueryHandler(
            Data.ServiceRequestRepository.Object,
            CurrentUser.Object,
            Executor
        );
    }

    [Fact]
    public async Task Handle_SomeStatusesMissing_ReturnsAllFiveInOrderZeroFilled()
    {
        // Arrange
        AddRequest(ServiceRequestStatus.Pending);
        AddRequest(ServiceRequestStatus.Pending);
        AddRequest(ServiceRequestStatus.Completed);

        // Act
        var result = await _handler.Handle(new GetStatusBreakdownQuery(), CancellationToken.None);

        // Assert
        result.Items.Should().Equal(
            new StatusCount(ServiceRequestStatus.Pending, 2),
            new StatusCount(ServiceRequestStatus.Assigned, 0),
            new StatusCount(ServiceRequestStatus.InProgress, 0),
            new StatusCount(ServiceRequestStatus.Completed, 1),
            new StatusCount(ServiceRequestStatus.Cancelled, 0)
        );
    }

    [Fact]
    public async Task Handle_NoRequests_ReturnsFiveZeroRows()
    {
        // Act
        var result = await _handler.Handle(new GetStatusBreakdownQuery(), CancellationToken.None);

        // Assert
        result.Items.Should().HaveCount(5).And.OnlyContain(i => i.Count == 0);
    }
}
