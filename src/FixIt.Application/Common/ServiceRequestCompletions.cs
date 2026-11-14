using FixIt.Domain.Entities;
using FixIt.Domain.Enums;

namespace FixIt.Application.Common;

/// <summary>
/// A completed request together with the moment it was completed. Member-init (not a positional
/// record) so EF Core can keep translating filters and aggregates applied on top of it.
/// </summary>
public sealed class CompletedServiceRequest
{
    public Guid ServiceRequestId { get; init; }
    public Guid? AssignedWorkerId { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime CompletedAt { get; init; }
}

public static class ServiceRequestCompletions
{
    /// <summary>
    /// The request entity has no completion timestamp; the authoritative one is the latest
    /// Completed status log. Completed requests without such a log (e.g. imported data) have no
    /// known completion time and are left out of time-based statistics.
    /// </summary>
    public static IQueryable<CompletedServiceRequest> WithCompletedAt(
        IQueryable<ServiceRequest> requests,
        IQueryable<ServiceLog> logs
    )
    {
        return requests
            .Where(r => r.Status == ServiceRequestStatus.Completed)
            .Select(r => new
            {
                Request = r,
                CompletedAt = logs.Where(l =>
                        l.ServiceRequestId == r.Id && l.NewStatus == ServiceRequestStatus.Completed
                    )
                    .Max(l => (DateTime?)l.CreatedAt),
            })
            .Where(x => x.CompletedAt != null)
            .Select(x => new CompletedServiceRequest
            {
                ServiceRequestId = x.Request.Id,
                AssignedWorkerId = x.Request.AssignedWorkerId,
                CreatedAt = x.Request.CreatedAt,
                CompletedAt = x.CompletedAt!.Value,
            });
    }

    public static IQueryable<CompletedServiceRequest> CompletedWithin(
        this IQueryable<CompletedServiceRequest> completions,
        TimeWindow window
    )
    {
        return completions.Where(c => c.CompletedAt > window.Start && c.CompletedAt <= window.End);
    }
}
