using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;

namespace FixIt.Application.Features.Dashboard.Common;

public static class DashboardQueries
{
    /// <summary>
    /// Request counts per status, grouped in the database. Every status is present in the result
    /// (zero when no request has it) so callers never have to guard against missing keys.
    /// </summary>
    public static async Task<IReadOnlyDictionary<ServiceRequestStatus, int>> CountByStatusAsync(
        IQueryable<ServiceRequest> requests,
        IQueryableExecutor queryableExecutor,
        CancellationToken cancellationToken
    )
    {
        var grouped = await queryableExecutor.ToListAsync(
            requests.GroupBy(r => r.Status).Select(g => new { Status = g.Key, Count = g.Count() }),
            cancellationToken
        );
        var counts = grouped.ToDictionary(x => x.Status, x => x.Count);

        return Enum.GetValues<ServiceRequestStatus>()
            .ToDictionary(status => status, status => counts.GetValueOrDefault(status));
    }
}
