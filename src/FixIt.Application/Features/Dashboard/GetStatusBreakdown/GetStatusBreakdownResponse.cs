using FixIt.Domain.Enums;

namespace FixIt.Application.Features.Dashboard.GetStatusBreakdown;

public record StatusCount(ServiceRequestStatus Status, int Count);

public record GetStatusBreakdownResponse(IReadOnlyList<StatusCount> Items);
