using FixIt.Application.Features.Dashboard.Common;
using FluentAssertions;
using Xunit;

namespace FixIt.Application.Tests.Features.Dashboard;

public class DashboardMathTests
{
    [Theory]
    [InlineData(0, 0, 0)]
    [InlineData(5, 0, 100)]
    [InlineData(0.5, 0, 100)]
    [InlineData(3, 2, 50)]
    [InlineData(2, 2, 0)]
    [InlineData(1, 3, -66.7)]
    [InlineData(0, 4, -100)]
    [InlineData(10.25, 20, -48.8)]
    public void PercentChange_ReturnsRoundedChange(double current, double previous, double expected)
    {
        DashboardMath.PercentChange(current, previous).Should().Be(expected);
    }

    [Theory]
    [InlineData(10.25, 10.3)]
    [InlineData(10.24, 10.2)]
    [InlineData(-48.75, -48.8)]
    [InlineData(0, 0)]
    public void Round1_RoundsHalfAwayFromZero(double value, double expected)
    {
        DashboardMath.Round1(value).Should().Be(expected);
    }
}
