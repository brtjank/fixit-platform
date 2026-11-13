namespace FixIt.Application.Features.Dashboard.GetRecentActivity;

public static class ActivityTypes
{
    public const string Created = "created";
    public const string Assigned = "assigned";
    public const string Completed = "completed";
    public const string Cancelled = "cancelled";
    public const string StatusChanged = "status_changed";
}

public record ActivityItem(
    string Id,
    string Type,
    Guid ServiceRequestId,
    string ServiceRequestTitle,
    string ActorName,
    DateTime OccurredAt,
    string? Detail
);

public record GetRecentActivityResponse(IReadOnlyList<ActivityItem> Items);
