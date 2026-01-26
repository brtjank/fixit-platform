using FixIt.Domain.Entities;

namespace FixIt.Application.Features.ServiceRequests.GetServiceRequests;

public record GetServiceRequestsResponse(
    IEnumerable<ServiceRequest> Items,
    int Page,
    int PageSize,
    int TotalCount
);
