namespace FixIt.Application.Features.Dashboard.Common;

public static class DashboardMath
{
    // Away-from-zero matches the client's Math.round, so both sides show the same figure
    public static double Round1(double value) =>
        Math.Round(value, 1, MidpointRounding.AwayFromZero);

    /// <summary>
    /// Percent change from <paramref name="previous"/> to <paramref name="current"/>. With no
    /// baseline any growth is reported as +100% rather than infinity, and "nothing to nothing" as 0.
    /// </summary>
    public static double PercentChange(double current, double previous)
    {
        if (previous == 0)
            return current == 0 ? 0 : 100;

        return Round1((current - previous) / previous * 100);
    }
}
