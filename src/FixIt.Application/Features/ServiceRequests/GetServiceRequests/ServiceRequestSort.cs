using FixIt.Domain.Entities;
using FixIt.Domain.Exceptions;

namespace FixIt.Application.Features.ServiceRequests.GetServiceRequests;

public enum ServiceRequestSortField
{
    CreatedAt,
    Title,
    Status,
}

/// <summary>
/// Parsed form of the <c>sort</c> query parameter (<c>&lt;field&gt;[:&lt;dir&gt;]</c>).
/// </summary>
public sealed record ServiceRequestSort(ServiceRequestSortField Field, bool Descending)
{
    public static readonly ServiceRequestSort Default = new(ServiceRequestSortField.CreatedAt, true);

    private const char Separator = ':';

    public static ServiceRequestSort Parse(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return Default;

        var parts = value.Split(Separator);
        if (parts.Length > 2)
            throw new ServiceRequestSortInvalidException(value);

        var field = ParseField(parts[0].Trim()) ?? throw new ServiceRequestSortInvalidException(value);

        // A missing direction means ascending; an explicit but empty one ("title:") is rejected
        var descending = parts.Length == 1
            ? false
            : ParseDescending(parts[1].Trim()) ?? throw new ServiceRequestSortInvalidException(value);

        return new ServiceRequestSort(field, descending);
    }

    /// <summary>
    /// Always ends with a tie-break on Id so paging stays deterministic when sort keys collide.
    /// </summary>
    public IOrderedQueryable<ServiceRequest> Apply(IQueryable<ServiceRequest> queryable)
    {
        // Status is persisted as a string, so in the database it sorts alphabetically by enum name
        // rather than by workflow order; accepted as good enough for list views.
        var ordered = (Field, Descending) switch
        {
            (ServiceRequestSortField.Title, false) => queryable.OrderBy(sr => sr.Title),
            (ServiceRequestSortField.Title, true) => queryable.OrderByDescending(sr => sr.Title),
            (ServiceRequestSortField.Status, false) => queryable.OrderBy(sr => sr.Status),
            (ServiceRequestSortField.Status, true) => queryable.OrderByDescending(sr => sr.Status),
            (_, false) => queryable.OrderBy(sr => sr.CreatedAt),
            (_, true) => queryable.OrderByDescending(sr => sr.CreatedAt),
        };

        return ordered.ThenBy(sr => sr.Id);
    }

    private static ServiceRequestSortField? ParseField(string field) =>
        field.ToLowerInvariant() switch
        {
            "createdat" => ServiceRequestSortField.CreatedAt,
            "title" => ServiceRequestSortField.Title,
            "status" => ServiceRequestSortField.Status,
            _ => null,
        };

    private static bool? ParseDescending(string direction) =>
        direction.ToLowerInvariant() switch
        {
            "asc" => false,
            "desc" => true,
            _ => null,
        };
}
