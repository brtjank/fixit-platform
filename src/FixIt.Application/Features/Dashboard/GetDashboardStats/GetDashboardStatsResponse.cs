namespace FixIt.Application.Features.Dashboard.GetDashboardStats;

/// <summary>
/// Percent changes versus the previous 30 days. <see cref="OpenRequests"/> compares requests
/// created in each window, because the open backlog itself has no history to compare against.
/// </summary>
public record DashboardTrends(
    double OpenRequests,
    double CompletedLast30Days,
    double AvgResolutionHours
);

public record GetDashboardStatsResponse(
    int OpenRequests,
    int PendingUnassigned,
    int InProgress,
    int CompletedLast30Days,
    double AvgResolutionHours,
    int ActiveWorkers,
    int AvailableWorkers,
    DashboardTrends Trends
);
