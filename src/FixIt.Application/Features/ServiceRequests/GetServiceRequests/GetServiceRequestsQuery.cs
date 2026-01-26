using FixIt.Domain.Enums;
using MediatR;

namespace FixIt.Application.Features.ServiceRequests.GetServiceRequests;

public record GetServiceRequestsQuery(
    int Page = 1,
    int PageSize = 20,
    ServiceRequestStatus? Status = null,
    Guid? AssignedWorkerId = null
) : IRequest<GetServiceRequestsResponse>;
